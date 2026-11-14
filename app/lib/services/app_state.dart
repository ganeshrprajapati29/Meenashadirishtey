import 'dart:async';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/config.dart';
import 'api.dart';

/// Global app state: auth, language, socket & unread counters.
class AppState extends ChangeNotifier {
  Map<String, dynamic>? user;
  Map<String, dynamic>? profile;
  String lang = 'hi';
  bool ready = false;
  int unreadNotifications = 0;
  int unreadMessages = 0;
  io.Socket? socket;
  final _messages = StreamController<Map<String, dynamic>>.broadcast();
  final _events = StreamController<MapEntry<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get messages => _messages.stream;
  Stream<MapEntry<String, dynamic>> get events => _events.stream;

  bool get loggedIn => user != null;
  bool get hasProfile => user?['hasProfile'] == true;
  bool get isPremium => user?['isPremium'] == true;
  String get myId => user?['id']?.toString() ?? '';

  String tt(String en, String hi) => lang == 'hi' ? hi : en;

  Future<void> init() async {
    final p = await SharedPreferences.getInstance();
    lang = p.getString('msr_lang') ?? 'hi';
    Api.I.onUnauthorized = logout;
    await Api.I.loadToken();
    if (Api.I.token != null) await refresh();
    ready = true;
    notifyListeners();
  }

  Future<void> setLang(String l) async {
    lang = l;
    notifyListeners();
    final p = await SharedPreferences.getInstance();
    await p.setString('msr_lang', l);
    if (loggedIn) Api.I.patch('/auth/me', {'language': l}).catchError((_) => <String, dynamic>{});
  }

  Future<void> refresh() async {
    try {
      final r = await Api.I.get('/auth/me');
      user = Map<String, dynamic>.from(r['user']);
      profile = r['profile'] == null ? null : Map<String, dynamic>.from(r['profile']);
      _connectSocket();
      refreshCounts();
    } on ApiException catch (e) {
      if (e.status == 401) await logout();
    } catch (_) {}
    notifyListeners();
  }

  Future<void> loginWithToken(String token) async {
    await Api.I.saveToken(token);
    await refresh();
  }

  Future<void> logout() async {
    socket?.dispose();
    socket = null;
    user = null;
    profile = null;
    unreadMessages = 0;
    unreadNotifications = 0;
    await Api.I.saveToken(null);
    notifyListeners();
  }

  Future<void> refreshCounts() async {
    try {
      final n = await Api.I.get('/notifications', {'limit': 1});
      final c = await Api.I.get('/chat/conversations');
      unreadNotifications = (n['unread'] ?? 0) as int;
      unreadMessages = (c['totalUnread'] ?? 0) as int;
      notifyListeners();
    } catch (_) {}
  }

  void _connectSocket() {
    if (socket != null || Api.I.token == null) return;
    final s = io.io(
      AppConfig.apiUrl,
      io.OptionBuilder().setTransports(['websocket']).setAuth({'token': Api.I.token}).enableReconnection().disableAutoConnect().build(),
    );
    s.on('message:new', (d) {
      final m = Map<String, dynamic>.from(d as Map);
      _messages.add(m);
      if (m['sender'].toString() != myId) {
        unreadMessages++;
        notifyListeners();
      }
    });
    s.on('notification', (d) {
      unreadNotifications++;
      _events.add(MapEntry('notification', d));
      notifyListeners();
    });
    for (final e in ['typing', 'message:read', 'presence', 'interest:update']) {
      s.on(e, (d) => _events.add(MapEntry(e, d)));
    }
    s.connect();
    socket = s;
  }

  /// Send chat message over socket; falls back to REST.
  Future<Map<String, dynamic>> sendMessage(String to, String text) async {
    final s = socket;
    if (s != null && s.connected) {
      final c = Completer<Map<String, dynamic>>();
      s.emitWithAck('message:send', {'to': to, 'text': text}, ack: (res) {
        final r = Map<String, dynamic>.from(res as Map);
        if (r['ok'] == true) {
          c.complete(Map<String, dynamic>.from(r['message']));
        } else {
          c.completeError(ApiException(r['error']?.toString() ?? 'Failed', r['status'] as int?));
        }
      });
      return c.future.timeout(const Duration(seconds: 15));
    }
    final r = await Api.I.post('/chat/$to/messages', {'text': text});
    return Map<String, dynamic>.from(r['message']);
  }

  void emit(String event, dynamic data) => socket?.emit(event, data);
}
