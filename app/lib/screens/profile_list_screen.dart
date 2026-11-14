import 'package:material_ui/material_ui.dart';
import '../services/api.dart';
import '../widgets/common.dart';
import '../widgets/profile_card.dart';

/// Shortlist / visitors
class ProfileListScreen extends StatefulWidget {
  final String kind;
  const ProfileListScreen({super.key, required this.kind});
  @override
  State<ProfileListScreen> createState() => _ProfileListScreenState();
}

class _ProfileListScreenState extends State<ProfileListScreen> {
  List? items;
  @override
  void initState() {
    super.initState();
    Api.I.get('/profiles/${widget.kind}', {'limit': 50}).then((r) => setState(() => items = r['items'])).catchError((_) => setState(() => items = []));
  }

  @override
  Widget build(BuildContext context) {
    final shortlist = widget.kind == 'shortlist';
    return Scaffold(
      appBar: AppBar(title: Text(shortlist ? context.tt('Shortlisted', 'शॉर्टलिस्ट') : context.tt('Profile visitors', 'प्रोफाइल देखने वाले'))),
      body: items == null
          ? const Loading()
          : items!.isEmpty
              ? EmptyState(icon: shortlist ? Icons.favorite_border : Icons.visibility, title: context.tt('Nothing here yet', 'अभी यहाँ कुछ नहीं'))
              : ProfileGrid(items: items!),
    );
  }
}
