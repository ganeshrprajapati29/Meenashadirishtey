/// App configuration.
/// Override the API at build time:
///   flutter build apk --dart-define=API_URL=https://your-domain.com
class AppConfig {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://msr.72-60-110-25.sslip.io',
  );
  static String get api => '$apiUrl/api';

  static String fileUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$apiUrl$path';
  }
}
