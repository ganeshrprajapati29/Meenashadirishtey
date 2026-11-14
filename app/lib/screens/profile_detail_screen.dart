import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'chat_screen.dart';
import 'plans_screen.dart';

class ProfileDetailScreen extends StatefulWidget {
  final String id;
  const ProfileDetailScreen({super.key, required this.id});
  @override
  State<ProfileDetailScreen> createState() => _ProfileDetailScreenState();
}

class _ProfileDetailScreenState extends State<ProfileDetailScreen> {
  Map? d;
  Map? contact;
  int photo = 0;
  bool busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await Api.I.get('/profiles/${widget.id}');
      if (mounted) setState(() => d = r);
    } on ApiException catch (e) {
      if (mounted) {
        context.toast(e.message, error: true);
        Navigator.pop(context);
      }
    }
  }

  Future<void> _call(Future<Map<String, dynamic>> Function() fn, {String? ok}) async {
    setState(() => busy = true);
    try {
      await fn();
      if (ok != null && mounted) context.toast(ok);
      await _load();
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _contact() async {
    try {
      final r = await Api.I.get('/profiles/${d!['profile']['id']}/contact');
      setState(() => contact = r);
    } on ApiException catch (e) {
      if (!mounted) return;
      context.toast(e.message, error: true);
      if (e.status == 402) Navigator.push(context, MaterialPageRoute(builder: (_) => const PlansScreen()));
    }
  }

  Future<void> _report() async {
    String reason = 'fake_profile';
    final reasons = {'fake_profile': context.tt('Fake profile', 'फर्जी प्रोफाइल'), 'married': context.tt('Already married', 'पहले से विवाहित'), 'abusive': context.tt('Abusive', 'अभद्र व्यवहार'), 'spam': context.tt('Spam / money demand', 'पैसे की मांग'), 'other': context.tt('Other', 'अन्य')};
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => StatefulBuilder(builder: (c, set) => AlertDialog(
            title: Text(context.tt('Report profile', 'प्रोफाइल रिपोर्ट करें')),
            content: RadioGroup<String>(
              groupValue: reason,
              onChanged: (v) => set(() => reason = v!),
              child: Column(mainAxisSize: MainAxisSize.min, children: reasons.entries.map((e) => RadioListTile<String>(value: e.key, title: Text(e.value), dense: true)).toList()),
            ),
            actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: Text(context.tt('Cancel', 'रद्द'))), FilledButton(onPressed: () => Navigator.pop(c, true), child: Text(context.tt('Report', 'रिपोर्ट')))],
          )),
    );
    if (ok != true || !mounted) return;
    await _call(() => Api.I.post('/profiles/${d!['profile']['id']}/report', {'reason': reason}), ok: context.tt('Reported. Thank you.', 'रिपोर्ट भेज दी गई।'));
  }

  Widget _row(String k, dynamic v) {
    if (v == null || v.toString().isEmpty || v.toString() == '—') return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 130, child: Text(k, style: TextStyle(color: Colors.grey.shade600, fontSize: 13))),
        Expanded(child: Text(v.toString(), style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
      ]),
    );
  }

  Widget _section(IconData icon, String title, List<Widget> rows) => Card(
        margin: const EdgeInsets.fromLTRB(14, 12, 14, 0),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(icon, color: MsrColors.gold, size: 20), const SizedBox(width: 8), Text(title, style: displayStyle(17))]),
            const Divider(height: 18),
            ...rows,
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final lang = app.lang;
    if (d == null) return const Scaffold(body: Loading());
    final p = d!['profile'] as Map;
    final photos = (p['photos'] as List? ?? []);
    final isOwner = p['userId'].toString() == app.myId;
    final interest = d!['interest'] as Map?;
    final fam = (p['family'] ?? {}) as Map;
    final pref = (p['partnerPreference'] ?? {}) as Map;

    Widget action;
    if (isOwner) {
      action = const SizedBox.shrink();
    } else if (interest?['status'] == 'accepted' || d!['canChat'] == true) {
      action = GoldButton(label: context.tt('Chat now', 'चैट करें'), icon: Icons.chat, onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(userId: p['userId'].toString()))));
    } else if (interest?['status'] == 'pending' && interest?['direction'] == 'received') {
      action = Row(children: [
        Expanded(child: ElevatedButton(onPressed: busy ? null : () => _call(() => Api.I.patch('/interests/${interest!['id']}', {'action': 'accept'})), child: Text(context.tt('Accept', 'स्वीकार')))),
        const SizedBox(width: 8),
        Expanded(child: OutlinedButton(onPressed: busy ? null : () => _call(() => Api.I.patch('/interests/${interest!['id']}', {'action': 'decline'})), child: Text(context.tt('Decline', 'अस्वीकार')))),
      ]);
    } else if (interest?['status'] == 'pending') {
      action = OutlinedButton.icon(onPressed: null, icon: const Icon(Icons.schedule), label: Text(context.tt('Interest sent', 'रुचि भेजी गई')));
    } else if (interest?['status'] == 'declined') {
      action = OutlinedButton(onPressed: null, child: Text(context.tt('Not interested', 'रुचि नहीं')));
    } else {
      action = ElevatedButton.icon(
        onPressed: busy ? null : () => _call(() => Api.I.post('/interests', {'profileId': p['id']}), ok: context.tt('Interest sent 💌', 'रुचि भेज दी गई 💌')),
        icon: const Icon(Icons.send),
        label: Text(context.tt('Send Interest', 'रुचि भेजें')),
      );
    }

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: MediaQuery.of(context).size.width * 1.05,
          pinned: true,
          actions: [
            if (!isOwner)
              IconButton(
                onPressed: () => _call(() => Api.I.post('/profiles/${p['id']}/shortlist')),
                icon: Icon(d!['isShortlisted'] == true ? Icons.favorite : Icons.favorite_border),
              ),
            if (!isOwner)
              PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'report') _report();
                  if (v == 'block') {
                    final nav = Navigator.of(context);
                    _call(() => Api.I.post('/profiles/${p['id']}/block'), ok: context.tt('Blocked', 'ब्लॉक किया')).then((_) => nav.pop());
                  }
                },
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'report', child: Text(context.tt('Report', 'रिपोर्ट करें'))),
                  PopupMenuItem(value: 'block', child: Text(context.tt('Block', 'ब्लॉक करें'))),
                ],
              ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(fit: StackFit.expand, children: [
              photos.isEmpty
                  ? ProfileImage(gender: p['gender'])
                  : PageView.builder(
                      itemCount: photos.length,
                      onPageChanged: (i) => setState(() => photo = i),
                      itemBuilder: (_, i) => ProfileImage(url: photos[i]['url'], gender: p['gender']),
                    ),
              if (p['photoLocked'] == true)
                Container(color: Colors.black38, child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.lock, color: Colors.white, size: 40), Text(context.tt('Photos for premium / connected members', 'फोटो प्रीमियम / जुड़े सदस्यों के लिए'), style: const TextStyle(color: Colors.white))]))),
              const IgnorePointer(child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black38, Colors.transparent, Colors.transparent, Colors.black87])))),
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: IgnorePointer(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Flexible(child: Text('${p['firstName']} ${p['lastName'] ?? ''}', style: displayStyle(26, color: Colors.white))),
                      if (p['isVerified'] == true) const Padding(padding: EdgeInsets.only(left: 6), child: Icon(Icons.verified, color: Colors.lightBlueAccent)),
                    ]),
                    Text('${p['profileId']} · ${p['age']} ${context.tt('yrs', 'वर्ष')} · ${cmToFeet(p['height'])} · ${[p['district'], p['state']].where((e) => e != null).join(', ')}', style: const TextStyle(color: Colors.white70)),
                    if (photos.length > 1)
                      Padding(padding: const EdgeInsets.only(top: 8), child: Row(children: List.generate(photos.length, (i) => Container(margin: const EdgeInsets.only(right: 4), width: i == photo ? 18 : 6, height: 6, decoration: BoxDecoration(color: i == photo ? Colors.white : Colors.white54, borderRadius: BorderRadius.circular(4)))))),
                  ]),
                ),
              ),
            ]),
          ),
        ),
        SliverToBoxAdapter(
          child: Column(children: [
            if (!isOwner)
              Card(
                margin: const EdgeInsets.fromLTRB(14, 14, 14, 0),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    if (p['matchScore'] != null)
                      Row(children: [
                        Container(width: 54, height: 54, alignment: Alignment.center, decoration: const BoxDecoration(gradient: MsrColors.goldShine, shape: BoxShape.circle), child: Text('${p['matchScore']}%', style: const TextStyle(fontWeight: FontWeight.w800, color: MsrColors.maroonDark))),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(context.tt('Match with your preferences', 'आपकी पसंद से मेल'), style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text(p['gotraCompatible'] == true ? context.tt('✓ Gotra compatible', '✓ गोत्र मेल खाता है') : context.tt('✗ Gotra conflict', '✗ गोत्र टकराव'),
                              style: TextStyle(color: p['gotraCompatible'] == true ? MsrColors.green : Colors.red, fontSize: 13)),
                        ])),
                      ]),
                    const SizedBox(height: 12),
                    action,
                    const SizedBox(height: 8),
                    contact != null
                        ? Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(14)),
                            child: Row(children: [
                              const Icon(Icons.phone, color: MsrColors.green),
                              const SizedBox(width: 10),
                              Expanded(child: Text('${contact!['countryCode']} ${contact!['phone']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
                              IconButton(onPressed: () => launchUrl(Uri.parse('tel:${contact!['countryCode']}${contact!['phone']}')), icon: const Icon(Icons.call, color: MsrColors.green)),
                            ]),
                          )
                        : OutlinedButton.icon(onPressed: _contact, icon: const Icon(Icons.phone), label: Text(context.tt('View contact number', 'मोबाइल नंबर देखें'))),
                  ]),
                ),
              ),
            if ((p['about'] ?? '').toString().isNotEmpty)
              _section(Icons.person, context.tt('About', 'परिचय'), [Text(p['about'], style: const TextStyle(height: 1.5))]),
            _section(Icons.badge, context.tt('Basic details', 'मूल जानकारी'), [
              _row(context.tt('Created by', 'प्रोफाइल बनाई'), labelOf('createdFor', p['createdFor'], lang)),
              _row(context.tt('Marital status', 'वैवाहिक स्थिति'), labelOf('maritalStatus', p['maritalStatus'], lang)),
              _row(context.tt('Height', 'लंबाई'), p['height'] != null ? '${cmToFeet(p['height'])} (${p['height']} cm)' : null),
              _row(context.tt('Complexion', 'रंग'), p['complexion'] != null ? labelOf('complexion', p['complexion'], lang) : null),
              _row(context.tt('Diet', 'खान-पान'), p['diet'] != null ? labelOf('diet', p['diet'], lang) : null),
            ]),
            _section(Icons.account_tree, context.tt('Gotra & horoscope', 'गोत्र व कुंडली'), [
              _row(context.tt('Gotra', 'गोत्र'), p['gotra']),
              _row(context.tt("Mother's gotra", 'माँ का गोत्र'), p['motherGotra']),
              _row(context.tt("Dadi's gotra", 'दादी का गोत्र'), p['dadiGotra']),
              _row(context.tt("Nani's gotra", 'नानी का गोत्र'), p['naniGotra']),
              _row(context.tt('Rashi', 'राशि'), p['rashi']),
              _row(context.tt('Manglik', 'मांगलिक'), labelOf('manglik', p['manglik'], lang)),
            ]),
            _section(Icons.school, context.tt('Education & career', 'शिक्षा व करियर'), [
              _row(context.tt('Education', 'शिक्षा'), [p['education'], p['educationDetail']].where((e) => e != null).join(' – ')),
              _row(context.tt('Employed in', 'रोज़गार'), p['employedIn'] != null ? labelOf('employedIn', p['employedIn'], lang) : null),
              _row(context.tt('Occupation', 'पेशा'), [p['occupation'], p['occupationDetail']].where((e) => e != null).join(' – ')),
              _row(context.tt('Annual income', 'वार्षिक आय'), p['annualIncome']),
              _row(context.tt('Location', 'स्थान'), [p['city'], p['district'], p['state'], p['country']].where((e) => e != null).join(', ')),
            ]),
            _section(Icons.family_restroom, context.tt('Family', 'परिवार'), [
              _row(context.tt("Father's name", 'पिता का नाम'), fam['fatherName']),
              _row(context.tt("Father's occupation", 'पिता का व्यवसाय'), fam['fatherOccupation']),
              _row(context.tt("Mother's occupation", 'माता का व्यवसाय'), fam['motherOccupation']),
              _row(context.tt('Brothers / Sisters', 'भाई / बहनें'), '${fam['brothers'] ?? 0} / ${fam['sisters'] ?? 0}'),
              _row(context.tt('Family type', 'परिवार'), fam['familyType'] != null ? labelOf('familyType', fam['familyType'], lang) : null),
              _row(context.tt('Native place', 'मूल निवास'), fam['nativePlace']),
            ]),
            _section(Icons.favorite, context.tt('Partner preference', 'जीवनसाथी की पसंद'), [
              _row(context.tt('Age', 'उम्र'), pref['ageMin'] != null ? '${pref['ageMin']} – ${pref['ageMax'] ?? ''}' : null),
              _row(context.tt('Marital status', 'वैवाहिक स्थिति'), (pref['maritalStatus'] as List? ?? []).map((e) => labelOf('maritalStatus', e, lang)).join(', ')),
              _row(context.tt('Employed in', 'रोज़गार'), (pref['employedIn'] as List? ?? []).map((e) => labelOf('employedIn', e, lang)).join(', ')),
              _row(context.tt('States', 'राज्य'), (pref['states'] as List? ?? []).join(', ')),
              _row(context.tt('Expectations', 'अपेक्षाएं'), pref['about']),
            ]),
            const SizedBox(height: 30),
          ]),
        ),
      ]),
    );
  }
}
