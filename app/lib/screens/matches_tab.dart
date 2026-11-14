import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import '../widgets/profile_card.dart';

class MatchesTab extends StatefulWidget {
  const MatchesTab({super.key});
  @override
  State<MatchesTab> createState() => _MatchesTabState();
}

class _MatchesTabState extends State<MatchesTab> {
  final Map<String, dynamic> filters = {'gotraFilter': 'true'};
  final scroll = ScrollController();
  final kw = TextEditingController();
  List items = [];
  int page = 1;
  int pages = 1;
  int total = 0;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    scroll.addListener(() {
      if (scroll.position.pixels > scroll.position.maxScrollExtent - 400 && !loading && page < pages) {
        page++;
        _load();
      }
    });
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) page = 1;
    setState(() => loading = true);
    try {
      final q = <String, dynamic>{...filters, 'page': page, 'limit': 12};
      if (kw.text.trim().isNotEmpty) q['keyword'] = kw.text.trim();
      q.removeWhere((k, v) => v == null || v.toString().isEmpty);
      final r = await Api.I.get('/profiles/search', q);
      setState(() {
        items = reset ? r['items'] : [...items, ...r['items']];
        pages = r['pages'] ?? 1;
        total = r['total'] ?? 0;
      });
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _openFilters() {
    final lang = context.read<AppState>().lang;
    final tmp = Map<String, dynamic>.from(filters);
    final ages = [for (var a = 18; a <= 60; a++) a];
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (c) => StatefulBuilder(builder: (c, set) {
        Widget drop(String label, String key, List opts, {String? group}) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DropdownButtonFormField<dynamic>(
                initialValue: opts.map((e) => e.toString()).contains(tmp[key]?.toString()) ? opts.firstWhere((e) => e.toString() == tmp[key].toString()) : null,
                isExpanded: true,
                decoration: InputDecoration(labelText: label),
                items: [DropdownMenuItem(value: null, child: Text(context.tt('Any', 'कोई भी'))), ...opts.map((o) => DropdownMenuItem(value: o, child: Text(group != null ? labelOf(group, o, lang) : '$o')))],
                onChanged: (v) => set(() => tmp[key] = v?.toString()),
              ),
            );
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(c).viewInsets.bottom + 16),
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(4)))),
              const SizedBox(height: 12),
              Text(context.tt('Filters', 'फ़िल्टर'), style: displayStyle(20)),
              const SizedBox(height: 14),
              Row(children: [Expanded(child: drop(context.tt('Age from', 'उम्र से'), 'ageMin', ages)), const SizedBox(width: 10), Expanded(child: drop(context.tt('Age to', 'उम्र तक'), 'ageMax', ages))]),
              drop(context.tt('Marital status', 'वैवाहिक स्थिति'), 'maritalStatus', kLabels['maritalStatus']!.keys.toList(), group: 'maritalStatus'),
              drop(context.tt('Employed in', 'रोज़गार'), 'employedIn', kLabels['employedIn']!.keys.toList(), group: 'employedIn'),
              drop(context.tt('State', 'राज्य'), 'state', const ['Rajasthan', 'Madhya Pradesh', 'Delhi', 'Uttar Pradesh', 'Haryana', 'Gujarat', 'Maharashtra']),
              SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(context.tt('Apply gotra rules', 'गोत्र नियम लागू करें')), value: tmp['gotraFilter'] != 'false', onChanged: (v) => set(() => tmp['gotraFilter'] = v ? 'true' : 'false')),
              SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(context.tt('With photo only', 'सिर्फ फोटो वाली')), value: tmp['withPhoto'] == 'true', onChanged: (v) => set(() => tmp['withPhoto'] = v ? 'true' : null)),
              SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(context.tt('Verified only', 'सिर्फ वेरिफाइड')), value: tmp['verified'] == 'true', onChanged: (v) => set(() => tmp['verified'] = v ? 'true' : null)),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: OutlinedButton(onPressed: () { filters..clear()..['gotraFilter'] = 'true'; Navigator.pop(c); _load(reset: true); }, child: Text(context.tt('Reset', 'रीसेट')))),
                const SizedBox(width: 12),
                Expanded(child: ElevatedButton(onPressed: () { filters..clear()..addAll(tmp); Navigator.pop(c); _load(reset: true); }, child: Text(context.tt('Apply', 'लागू करें')))),
              ]),
            ]),
          ),
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tt('Find Matches', 'रिश्ते खोजें')),
        actions: [IconButton(onPressed: _openFilters, icon: const Icon(Icons.tune))],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: TextField(
              controller: kw,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _load(reset: true),
              decoration: InputDecoration(
                hintText: context.tt('Name, MSR ID, city...', 'नाम, MSR ID, शहर...'),
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => _load(reset: true),
        child: items.isEmpty && loading
            ? const Loading()
            : items.isEmpty
                ? ListView(children: [EmptyState(icon: Icons.people_outline, title: context.tt('No profiles found', 'कोई प्रोफाइल नहीं मिली'), text: context.tt('Try changing filters', 'फ़िल्टर बदल कर देखें'))])
                : Column(children: [
                    Padding(padding: const EdgeInsets.fromLTRB(16, 10, 16, 0), child: Align(alignment: Alignment.centerLeft, child: Text('$total ${context.tt('profiles', 'प्रोफाइल')}', style: TextStyle(color: Colors.grey.shade600)))),
                    Expanded(child: ProfileGrid(items: items, controller: scroll)),
                    if (loading) const LinearProgressIndicator(color: MsrColors.gold),
                  ]),
      ),
    );
  }
}
