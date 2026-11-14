import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'services/app_state.dart';
import 'screens/login_screen.dart';
import 'screens/profile_form_screen.dart';
import 'screens/main_shell.dart';
import 'widgets/common.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: Brightness.light));
  runApp(ChangeNotifierProvider(create: (_) => AppState()..init(), child: const MsrApp()));
}

class MsrApp extends StatelessWidget {
  const MsrApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Meena Shadi Rishtey',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const RootGate(),
    );
  }
}

/// Decides which screen to show based on auth state
class RootGate extends StatelessWidget {
  const RootGate({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    if (!app.ready) return const SplashScreen();
    if (!app.loggedIn) return const LoginScreen();
    if (!app.hasProfile) return const ProfileFormScreen();
    return const MainShell();
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: MsrColors.royal),
          child: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const MsrLogo(size: 130),
              const SizedBox(height: 20),
              Text('Meena Shadi Rishtey', style: displayStyle(26, color: Colors.white)),
              const SizedBox(height: 4),
              const Text('मीणा शादी रिश्ते', style: TextStyle(color: MsrColors.goldLight, fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 30),
              const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(color: MsrColors.goldLight, strokeWidth: 2.5)),
            ]),
          ),
        ),
      );
}
