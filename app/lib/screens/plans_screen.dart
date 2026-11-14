import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});
  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  Map? data;
  String? busy;

  @override
  void initState() {
    super.initState();
    Api.I.get('/payments/plans').then((r) => setState(() => data = r));
  }

  Future<void> _buy(Map p) async {
    if (data?['paymentMode'] != 'demo') {
      // Online payment happens securely on the website checkout (Razorpay)
      await launchUrl(Uri.parse('${AppConfig.apiUrl}/plans'), mode: LaunchMode.externalApplication);
      return;
    }
    setState(() => busy = p['_id']);
    try {
      await Api.I.post('/payments/order', {'planId': p['_id']});
      if (!mounted) return;
      await context.read<AppState>().refresh();
      if (mounted) {
        context.toast(context.tt('${p['name']} activated 👑', '${p['nameHi'] ?? p['name']} सक्रिय 👑'));
        Navigator.pop(context);
      }
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final hi = app.lang == 'hi';
    return Scaffold(
      appBar: AppBar(title: Text(context.tt('Membership Plans', 'मेंबरशिप प्लान'))),
      body: data == null
          ? const Loading()
          : ListView(padding: const EdgeInsets.all(16), children: [
              if (app.isPremium)
                Container(
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(gradient: MsrColors.royal, borderRadius: BorderRadius.circular(16)),
                  child: Row(children: [
                    const Icon(Icons.workspace_premium, color: MsrColors.goldLight, size: 34),
                    const SizedBox(width: 10),
                    Expanded(child: Text('${app.user?['premium']?['planName']} · ${app.user?['premium']?['contactsLeft']} ${context.tt('contacts left', 'नंबर बाकी')}', style: const TextStyle(color: Colors.white))),
                  ]),
                ),
              if (data!['paymentMode'] == 'demo')
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(context.tt('Demo mode: plans activate instantly for testing.', 'डेमो मोड: टेस्टिंग के लिए प्लान तुरंत सक्रिय होगा।'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Color(0xFF8A5E10))),
                ),
              ...(data!['items'] as List).map((p) {
                final popular = p['isPopular'] == true;
                final features = List<String>.from((hi && (p['featuresHi'] as List?)?.isNotEmpty == true) ? p['featuresHi'] : p['features']);
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: popular ? MsrColors.gold : Colors.transparent, width: 2),
                    boxShadow: [BoxShadow(color: MsrColors.maroon.withValues(alpha: .1), blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  padding: const EdgeInsets.all(18),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Icon(Icons.workspace_premium, color: Color(int.parse((p['color'] ?? '#D4A017').toString().replaceFirst('#', '0xFF'))), size: 30),
                      const SizedBox(width: 8),
                      Text(hi && p['nameHi'] != null ? p['nameHi'] : p['name'], style: displayStyle(22)),
                      const Spacer(),
                      if (popular) InfoChip(context.tt('Most Popular', 'सबसे लोकप्रिय'), bg: MsrColors.goldLight, fg: MsrColors.maroonDark),
                    ]),
                    const SizedBox(height: 8),
                    Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('₹${p['price']}', style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
                      const SizedBox(width: 8),
                      if (p['mrp'] != null) Text('₹${p['mrp']}', style: const TextStyle(decoration: TextDecoration.lineThrough, color: Colors.grey)),
                      const Spacer(),
                      Text('${p['durationDays']} ${context.tt('days', 'दिन')}', style: TextStyle(color: Colors.grey.shade600)),
                    ]),
                    const SizedBox(height: 10),
                    ...features.map((f) => Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [const Icon(Icons.check_circle, color: MsrColors.green, size: 18), const SizedBox(width: 8), Expanded(child: Text(f))]))),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: busy == p['_id']
                          ? const Center(child: CircularProgressIndicator(color: MsrColors.maroon))
                          : popular
                              ? GoldButton(label: context.tt('Buy now', 'अभी खरीदें'), onPressed: () => _buy(p))
                              : ElevatedButton(onPressed: () => _buy(p), child: Text(context.tt('Buy now', 'अभी खरीदें'))),
                    ),
                  ]),
                );
              }),
            ]),
    );
  }
}
