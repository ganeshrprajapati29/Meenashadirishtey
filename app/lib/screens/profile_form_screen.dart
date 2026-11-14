import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'photos_screen.dart';

/// Biodata wizard. existing == null → create, otherwise edit.
class ProfileFormScreen extends StatefulWidget {
  final Map<String, dynamic>? existing;
  const ProfileFormScreen({super.key, this.existing});
  @override
  State<ProfileFormScreen> createState() => _ProfileFormScreenState();
}

class _ProfileFormScreenState extends State<ProfileFormScreen> {
  int step = 0;
  bool busy = false;
  List<String> gotras = [];
  Map consts = {};
  late Map<String, dynamic> f;
  late Map<String, dynamic> fam;
  late Map<String, dynamic> pref;
  final _key = GlobalKey<FormState>();

  bool get isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing ?? {};
    f = {
      'createdFor': e['createdFor'] ?? 'self', 'firstName': e['firstName'] ?? '', 'lastName': e['lastName'] ?? 'Meena', 'gender': e['gender'],
      'dob': e['dob'] != null ? DateTime.tryParse(e['dob'].toString()) : null, 'maritalStatus': e['maritalStatus'] ?? 'never_married', 'height': e['height'],
      'complexion': e['complexion'], 'diet': e['diet'], 'gotra': e['gotra'] ?? '', 'motherGotra': e['motherGotra'] ?? '', 'dadiGotra': e['dadiGotra'] ?? '',
      'naniGotra': e['naniGotra'] ?? '', 'rashi': e['rashi'], 'manglik': e['manglik'] ?? 'dont_know', 'education': e['education'], 'educationDetail': e['educationDetail'] ?? '',
      'employedIn': e['employedIn'], 'occupation': e['occupation'] ?? '', 'occupationDetail': e['occupationDetail'] ?? '', 'annualIncome': e['annualIncome'],
      'state': e['state'], 'district': e['district'] ?? '', 'city': e['city'] ?? '', 'isNri': e['isNri'] ?? false, 'about': e['about'] ?? '',
      'photoPrivacy': e['photoPrivacy'] ?? 'all', 'contactPrivacy': e['contactPrivacy'] ?? 'premium',
    };
    fam = Map<String, dynamic>.from(e['family'] ?? {});
    pref = Map<String, dynamic>.from(e['partnerPreference'] ?? {});
    Api.I.get('/profiles/meta').then((r) {
      if (mounted) setState(() { gotras = List<String>.from(r['gotras'] ?? []); consts = r['constants'] ?? {}; });
    }).catchError((_) {});
  }

  List<String> get titles => [
        context.tt('Basic details', 'मूल जानकारी'),
        context.tt('Gotra & horoscope', 'गोत्र व कुंडली'),
        context.tt('Education & location', 'शिक्षा व स्थान'),
        context.tt('Family', 'परिवार'),
        context.tt('Partner preference', 'जीवनसाथी की पसंद'),
      ];

  Map<String, dynamic> _payload() {
    final out = <String, dynamic>{};
    f.forEach((k, v) {
      if (v == null || (v is String && v.trim().isEmpty)) return;
      out[k] = v is DateTime ? v.toIso8601String().substring(0, 10) : v;
    });
    out['family'] = Map.fromEntries(fam.entries.where((e) => e.value != null && e.value.toString().isNotEmpty));
    out['partnerPreference'] = Map.fromEntries(pref.entries.where((e) => e.value != null && e.value.toString().isNotEmpty && e.value.toString() != '[]'));
    return out;
  }

  Future<void> _next() async {
    if (!_key.currentState!.validate()) return;
    if (step == 0 && (f['gender'] == null || f['dob'] == null)) {
      context.toast(context.tt('Please select gender and date of birth', 'कृपया लिंग और जन्म तिथि चुनें'), error: true);
      return;
    }
    if (step < 4 && !isEdit) {
      setState(() => step++);
      return;
    }
    setState(() => busy = true);
    try {
      if (isEdit) {
        await Api.I.put('/profiles/me', _payload());
      } else {
        await Api.I.post('/profiles/me', _payload());
      }
      if (!mounted) return;
      final app = context.read<AppState>();
      if (isEdit) {
        context.toast(context.tt('Profile saved', 'प्रोफाइल सेव हो गई'));
        await app.refresh();
        if (mounted) Navigator.pop(context, true);
      } else {
        await Navigator.push(context, MaterialPageRoute(builder: (_) => const PhotosScreen(onboarding: true)));
        await app.refresh();
      }
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  // ---------- field helpers ----------
  Widget _text(String label, String key, {Map<String, dynamic>? target, bool required = false, int lines = 1, TextInputType? type}) {
    final t = target ?? f;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        initialValue: t[key]?.toString() ?? '',
        maxLines: lines,
        keyboardType: type,
        decoration: InputDecoration(labelText: label),
        validator: required ? (v) => (v == null || v.trim().length < 2) ? context.tt('Required', 'ज़रूरी') : null : null,
        onChanged: (v) => t[key] = type == TextInputType.number ? int.tryParse(v) : v,
      ),
    );
  }

  Widget _drop(String label, String key, List<dynamic> options, {Map<String, dynamic>? target, String? group}) {
    final t = target ?? f;
    final lang = context.read<AppState>().lang;
    final items = options.map((o) => DropdownMenuItem<dynamic>(value: o, child: Text(group != null ? labelOf(group, o, lang) : o.toString(), overflow: TextOverflow.ellipsis))).toList();
    final value = options.contains(t[key]) ? t[key] : null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: DropdownButtonFormField<dynamic>(
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: items,
        onChanged: (v) => setState(() => t[key] = v),
      ),
    );
  }

  Widget _gotra(String label, String key, {bool required = false}) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Autocomplete<String>(
          initialValue: TextEditingValue(text: f[key] ?? ''),
          optionsBuilder: (v) => v.text.isEmpty ? const Iterable<String>.empty() : gotras.where((g) => g.toLowerCase().startsWith(v.text.toLowerCase())),
          onSelected: (v) => f[key] = v,
          fieldViewBuilder: (ctx, ctrl, node, onSubmit) => TextFormField(
            controller: ctrl,
            focusNode: node,
            decoration: InputDecoration(labelText: label),
            validator: required ? (v) => (v == null || v.trim().length < 2) ? context.tt('Required', 'ज़रूरी') : null : null,
            onChanged: (v) => f[key] = v,
          ),
        ),
      );

  Widget _multi(String label, String key, List<dynamic> options, {String? group}) {
    final lang = context.read<AppState>().lang;
    final sel = List<String>.from(pref[key] ?? []);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: MsrColors.maroon, fontSize: 13)),
        const SizedBox(height: 6),
        Wrap(spacing: 6, runSpacing: 6, children: options.map((o) {
          final on = sel.contains(o);
          return FilterChip(
            label: Text(group != null ? labelOf(group, o, lang) : o.toString(), style: TextStyle(fontSize: 12, color: on ? Colors.white : MsrColors.ink)),
            selected: on,
            selectedColor: MsrColors.maroon,
            checkmarkColor: Colors.white,
            backgroundColor: Colors.white,
            onSelected: (v) => setState(() {
              v ? sel.add(o) : sel.remove(o);
              pref[key] = sel;
            }),
          );
        }).toList()),
      ]),
    );
  }

  List<int> get heights => [for (var cm = 137; cm <= 213; cm += 2) cm];
  List<int> get ages => [for (var a = 18; a <= 65; a++) a];

  Widget _section(int i) {
    final lang = context.watch<AppState>().lang;
    switch (i) {
      case 0:
        return Column(children: [
          _drop(context.tt('Profile created for', 'प्रोफाइल किसके लिए'), 'createdFor', kLabels['createdFor']!.keys.toList(), group: 'createdFor'),
          _text(context.tt('First name *', 'नाम *'), 'firstName', required: true),
          _text(context.tt('Surname', 'उपनाम'), 'lastName'),
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: SegmentedButton<String>(
              emptySelectionAllowed: true,
              segments: [
                ButtonSegment(value: 'male', label: Text(labelOf('gender', 'male', lang)), icon: const Icon(Icons.man)),
                ButtonSegment(value: 'female', label: Text(labelOf('gender', 'female', lang)), icon: const Icon(Icons.woman)),
              ],
              selected: {if (f['gender'] != null) f['gender']},
              onSelectionChanged: (s) => setState(() => f['gender'] = s.isEmpty ? null : s.first),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: InkWell(
              onTap: () async {
                final now = DateTime.now();
                final d = await showDatePicker(context: context, initialDate: f['dob'] ?? DateTime(now.year - 24), firstDate: DateTime(now.year - 75), lastDate: DateTime(now.year - 18, now.month, now.day));
                if (d != null) setState(() => f['dob'] = d);
              },
              child: InputDecorator(
                decoration: InputDecoration(labelText: context.tt('Date of birth *', 'जन्म तिथि *'), suffixIcon: const Icon(Icons.calendar_month)),
                child: Text(f['dob'] == null ? '—' : '${f['dob'].day}/${f['dob'].month}/${f['dob'].year}'),
              ),
            ),
          ),
          _drop(context.tt('Marital status', 'वैवाहिक स्थिति'), 'maritalStatus', kLabels['maritalStatus']!.keys.toList(), group: 'maritalStatus'),
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: DropdownButtonFormField<int>(
              initialValue: heights.contains(f['height']) ? f['height'] : null,
              decoration: InputDecoration(labelText: context.tt('Height', 'लंबाई')),
              items: heights.map((h) => DropdownMenuItem(value: h, child: Text('${cmToFeet(h)} ($h cm)'))).toList(),
              onChanged: (v) => f['height'] = v,
            ),
          ),
          _drop(context.tt('Complexion', 'रंग'), 'complexion', kLabels['complexion']!.keys.toList(), group: 'complexion'),
          _drop(context.tt('Diet', 'खान-पान'), 'diet', kLabels['diet']!.keys.toList(), group: 'diet'),
          _text(context.tt('About me', 'मेरे बारे में'), 'about', lines: 4),
        ]);
      case 1:
        return Column(children: [
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: MsrColors.goldPale, borderRadius: BorderRadius.circular(12)),
            child: Text(context.tt('We hide profiles of your own, mother\'s, dadi\'s & nani\'s gotra automatically.', 'हम अपना, माँ, दादी और नानी के गोत्र वाली प्रोफाइल अपने आप हटा देते हैं।'), style: const TextStyle(fontSize: 13)),
          ),
          _gotra(context.tt('Your gotra *', 'आपका गोत्र *'), 'gotra', required: true),
          _gotra(context.tt("Mother's gotra", 'माँ का गोत्र'), 'motherGotra'),
          _gotra(context.tt("Dadi's gotra", 'दादी का गोत्र'), 'dadiGotra'),
          _gotra(context.tt("Nani's gotra", 'नानी का गोत्र'), 'naniGotra'),
          _drop(context.tt('Rashi', 'राशि'), 'rashi', consts['RASHI'] ?? []),
          _drop(context.tt('Manglik', 'मांगलिक'), 'manglik', kLabels['manglik']!.keys.toList(), group: 'manglik'),
        ]);
      case 2:
        return Column(children: [
          _drop(context.tt('Highest education', 'उच्चतम शिक्षा'), 'education', consts['EDUCATION'] ?? []),
          _text(context.tt('Education details', 'शिक्षा विवरण'), 'educationDetail'),
          _drop(context.tt('Employed in', 'रोज़गार क्षेत्र'), 'employedIn', kLabels['employedIn']!.keys.toList(), group: 'employedIn'),
          _text(context.tt('Occupation', 'पेशा'), 'occupation'),
          _text(context.tt('Work details', 'कार्य विवरण'), 'occupationDetail'),
          _drop(context.tt('Annual income', 'वार्षिक आय'), 'annualIncome', consts['INCOME'] ?? []),
          _drop(context.tt('State', 'राज्य'), 'state', consts['STATES'] ?? []),
          _text(context.tt('District', 'ज़िला'), 'district'),
          _text(context.tt('City / Village', 'शहर / गाँव'), 'city'),
          SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(context.tt('I live outside India (NRI)', 'मैं भारत से बाहर रहता/रहती हूँ')), value: f['isNri'] == true, onChanged: (v) => setState(() => f['isNri'] = v)),
        ]);
      case 3:
        return Column(children: [
          _text(context.tt("Father's name", 'पिता का नाम'), 'fatherName', target: fam),
          _text(context.tt("Father's occupation", 'पिता का व्यवसाय'), 'fatherOccupation', target: fam),
          _text(context.tt("Mother's name", 'माता का नाम'), 'motherName', target: fam),
          _text(context.tt("Mother's occupation", 'माता का व्यवसाय'), 'motherOccupation', target: fam),
          Row(children: [
            Expanded(child: _drop(context.tt('Brothers', 'भाई'), 'brothers', [0, 1, 2, 3, 4, 5], target: fam)),
            const SizedBox(width: 10),
            Expanded(child: _drop(context.tt('Sisters', 'बहनें'), 'sisters', [0, 1, 2, 3, 4, 5], target: fam)),
          ]),
          _drop(context.tt('Family type', 'परिवार का प्रकार'), 'familyType', kLabels['familyType']!.keys.toList(), target: fam, group: 'familyType'),
          _drop(context.tt('Family status', 'पारिवारिक स्थिति'), 'familyStatus', kLabels['familyStatus']!.keys.toList(), target: fam, group: 'familyStatus'),
          _text(context.tt('Native place', 'मूल निवास'), 'nativePlace', target: fam),
        ]);
      default:
        return Column(children: [
          Row(children: [
            Expanded(child: _drop(context.tt('Age from', 'उम्र से'), 'ageMin', ages, target: pref)),
            const SizedBox(width: 10),
            Expanded(child: _drop(context.tt('Age to', 'उम्र तक'), 'ageMax', ages, target: pref)),
          ]),
          _multi(context.tt('Marital status', 'वैवाहिक स्थिति'), 'maritalStatus', kLabels['maritalStatus']!.keys.toList(), group: 'maritalStatus'),
          _multi(context.tt('Employed in', 'रोज़गार क्षेत्र'), 'employedIn', kLabels['employedIn']!.keys.toList(), group: 'employedIn'),
          _multi(context.tt('Preferred states', 'पसंदीदा राज्य'), 'states', (consts['STATES'] as List? ?? []).take(10).toList()),
          _text(context.tt('Expectations', 'अपेक्षाएं'), 'about', target: pref, lines: 3),
          if (isEdit) ...[
            _drop(context.tt('Who can see my photos', 'मेरी फोटो कौन देखे'), 'photoPrivacy', ['all', 'premium', 'connected']),
            _drop(context.tt('Who can see my number', 'मेरा नंबर कौन देखे'), 'contactPrivacy', ['premium', 'connected']),
          ],
        ]);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? context.tt('Edit Profile', 'प्रोफाइल बदलें') : context.tt('Create Biodata', 'बायोडाटा बनाएं')),
        actions: [if (!isEdit) IconButton(onPressed: app.logout, icon: const Icon(Icons.logout))],
      ),
      body: Column(children: [
        SizedBox(
          height: 52,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            itemCount: 5,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: ChoiceChip(
                label: Text(titles[i], style: TextStyle(fontSize: 12, color: i == step ? Colors.white : MsrColors.ink)),
                selected: i == step,
                selectedColor: MsrColors.maroon,
                avatar: !isEdit && i < step ? const Icon(Icons.check_circle, size: 16, color: MsrColors.green) : null,
                onSelected: isEdit || i < step ? (_) => setState(() => step = i) : null,
              ),
            ),
          ),
        ),
        LinearProgressIndicator(value: (step + 1) / 5, color: MsrColors.gold, backgroundColor: MsrColors.maroonLight),
        Expanded(
          child: Form(
            key: _key,
            child: ListView(padding: const EdgeInsets.all(16), children: [
              Text(titles[step], style: displayStyle(20)),
              const SizedBox(height: 14),
              KeyedSubtree(key: ValueKey(step), child: _section(step)),
            ]),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
            child: Row(children: [
              if (step > 0 && !isEdit) ...[Expanded(child: OutlinedButton(onPressed: () => setState(() => step--), child: Text(context.tt('Back', 'पीछे')))), const SizedBox(width: 12)],
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: busy ? null : _next,
                  child: busy
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(isEdit ? context.tt('Save', 'सेव करें') : step == 4 ? context.tt('Create Profile', 'प्रोफाइल बनाएं') : context.tt('Next', 'आगे')),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}
