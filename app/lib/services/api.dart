import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config.dart';

class ApiException implements Exception {
  final int? status;
  final String message;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

/// Thin wrapper around Dio. All methods return decoded JSON maps.
class Api {
  Api._();
  static final Api I = Api._();

  String? token;
  void Function()? onUnauthorized;

  late final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConfig.api,
    connectTimeout: const Duration(seconds: 20),
    receiveTimeout: const Duration(seconds: 30),
  ))
    ..interceptors.add(InterceptorsWrapper(onRequest: (o, h) {
      if (token != null) o.headers['Authorization'] = 'Bearer $token';
      h.next(o);
    }));

  Future<void> loadToken() async {
    final p = await SharedPreferences.getInstance();
    token = p.getString('msr_token');
  }

  Future<void> saveToken(String? t) async {
    token = t;
    final p = await SharedPreferences.getInstance();
    if (t == null) {
      await p.remove('msr_token');
    } else {
      await p.setString('msr_token', t);
    }
  }

  Future<Map<String, dynamic>> _wrap(Future<Response> Function() call) async {
    try {
      final r = await call();
      return Map<String, dynamic>.from(r.data as Map);
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final data = e.response?.data;
      final msg = (data is Map && data['message'] != null)
          ? data['message'].toString()
          : (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout)
              ? 'No internet connection'
              : 'Something went wrong';
      if (status == 401 && token != null) onUnauthorized?.call();
      throw ApiException(msg, status);
    }
  }

  Future<Map<String, dynamic>> get(String path, [Map<String, dynamic>? q]) => _wrap(() => _dio.get(path, queryParameters: q));
  Future<Map<String, dynamic>> post(String path, [dynamic body]) => _wrap(() => _dio.post(path, data: body));
  Future<Map<String, dynamic>> put(String path, [dynamic body]) => _wrap(() => _dio.put(path, data: body));
  Future<Map<String, dynamic>> patch(String path, [dynamic body]) => _wrap(() => _dio.patch(path, data: body));
  Future<Map<String, dynamic>> delete(String path) => _wrap(() => _dio.delete(path));
}
