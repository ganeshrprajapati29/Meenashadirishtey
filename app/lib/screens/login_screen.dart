import 'dart:async';
import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final phoneCtrl = TextEditingController();
  final otpCtrl = TextEditingController();
  bool otpStep = false;
  bool busy = false;
  String? screenOtp;
  int timer = 0;
  Timer? _t;

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  Future<void> _send() async {
    final phone = phoneCtrl.text.trim();
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(phone)) {
      context.toast(context.tt('Enter a valid 10 digit mobile number', 'सही 10 अंकों का मोबाइल नंबर डालें'), error: true);
      return;
    }
    setState(() => busy = true);
    try {
      final r = await Api.I.post('/auth/send-otp', {'phone': phone});
      setState(() {
        otpStep = true;
        screenOtp = r['otp']?.toString();
        otpCtrl.clear();
        timer = (r['resendIn'] ?? 30) as int;
      });
      _t?.cancel();
      _t = Timer.periodic(const Duration(seconds: 1), (t) {
        if (timer <= 1) t.cancel();
        if (mounted) setState(() => timer--);
      });
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _verify([String? code]) async {
    final otp = code ?? otpCtrl.text.trim();
    if (otp.length != 6) return;
    setState(() => busy = true);
    try {
      final r = await Api.I.post('/auth/verify-otp', {'phone': phoneCtrl.text.trim(), 'otp': otp});
      if (!mounted) return;
      await context.read<AppState>().loginWithToken(r['token']);
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
      otpCtrl.clear();
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: MsrColors.royal),
        child: SafeArea(
          child: Column(children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton.icon(
                onPressed: () => app.setLang(app.lang == 'hi' ? 'en' : 'hi'),
                icon: const Icon(Icons.translate, color: Colors.white, size: 18),
                label: Text(app.lang == 'hi' ? 'English' : 'हिंदी', style: const TextStyle(color: Colors.white)),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 22),
                child: Column(children: [
                  const SizedBox(height: 10),
                  const MsrLogo(size: 110),
                  const SizedBox(height: 14),
                  Text('Meena Shadi Rishtey', style: displayStyle(26, color: Colors.white)),
                  const Text('मीणा शादी रिश्ते', style: TextStyle(color: MsrColors.goldLight, fontSize: 17, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(context.tt('Trusted matrimony for Meena samaj', 'मीणा समाज के लिए भरोसेमंद रिश्ते'), style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 28),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(22),
                      child: otpStep ? _otpView() : _phoneView(),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(context.tt('By continuing you agree to our Terms & Privacy Policy', 'आगे बढ़कर आप हमारी शर्तों व गोपनीयता नीति से सहमत हैं'),
                      textAlign: TextAlign.center, style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  const SizedBox(height: 20),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _phoneView() => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(context.tt('Login / Register', 'लॉगिन / रजिस्टर'), textAlign: TextAlign.center, style: displayStyle(22)),
        const SizedBox(height: 6),
        Text(context.tt('Enter your mobile number', 'अपना मोबाइल नंबर डालें'), textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 20),
        TextField(
          controller: phoneCtrl,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 18, letterSpacing: 1.5),
          decoration: const InputDecoration(counterText: '', prefixText: '+91  ', hintText: '98765 43210', prefixIcon: Icon(Icons.phone_android, color: MsrColors.maroon)),
          onSubmitted: (_) => _send(),
        ),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: busy ? null : _send, child: busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(context.tt('Get OTP', 'OTP प्राप्त करें'))),
      ]);

  Widget _otpView() => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          IconButton(onPressed: () => setState(() => otpStep = false), icon: const Icon(Icons.arrow_back, color: MsrColors.maroon)),
          Expanded(child: Text(context.tt('Verify OTP', 'OTP सत्यापित करें'), style: displayStyle(21))),
        ]),
        Text('${context.tt('Code sent to', 'कोड भेजा गया')} +91 ${phoneCtrl.text}', style: TextStyle(color: Colors.grey.shade600)),
        if (screenOtp != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: MsrColors.goldPale, borderRadius: BorderRadius.circular(16), border: Border.all(color: MsrColors.gold, width: 1.5)),
            child: Column(children: [
              Text(context.tt('YOUR OTP', 'आपका OTP'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF8A5E10), letterSpacing: 1)),
              const SizedBox(height: 4),
              Text(screenOtp!, style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, letterSpacing: 10, color: MsrColors.maroon)),
              const SizedBox(height: 6),
              GoldButton(label: context.tt('Auto-fill OTP', 'OTP भरें'), icon: Icons.content_copy, onPressed: () {
                otpCtrl.text = screenOtp!;
                _verify(screenOtp);
              }),
            ]),
          ),
        ],
        const SizedBox(height: 16),
        TextField(
          controller: otpCtrl,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 26, letterSpacing: 14, fontWeight: FontWeight.w700),
          decoration: const InputDecoration(counterText: '', hintText: '••••••'),
          onChanged: (v) {
            if (v.length == 6) _verify(v);
          },
        ),
        const SizedBox(height: 14),
        ElevatedButton(onPressed: busy ? null : () => _verify(), child: busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(context.tt('Verify & Continue', 'सत्यापित करें'))),
        const SizedBox(height: 8),
        TextButton(onPressed: timer > 0 || busy ? null : _send, child: Text(timer > 0 ? '${context.tt('Resend OTP in', 'दोबारा भेजें')} ${timer}s' : context.tt('Resend OTP', 'OTP दोबारा भेजें'))),
      ]);
}
