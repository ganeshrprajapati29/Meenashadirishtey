import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../screens/profile_detail_screen.dart';
import 'common.dart';

/// Grid card used across matches / recommendations / shortlist
class ProfileCard extends StatefulWidget {
  final Map<String, dynamic> p;
  const ProfileCard({super.key, required this.p});
  @override
  State<ProfileCard> createState() => _ProfileCardState();
}

class _ProfileCardState extends State<ProfileCard> {
  late bool shortlisted = widget.p['isShortlisted'] == true;
  late Map? interest = widget.p['interest'] as Map?;
  bool busy = false;

  Future<void> _shortlist() async {
    try {
      final r = await Api.I.post('/profiles/${widget.p['id']}/shortlist');
      setState(() => shortlisted = r['shortlisted'] == true);
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    }
  }

  Future<void> _interest() async {
    setState(() => busy = true);
    try {
      final r = await Api.I.post('/interests', {'profileId': widget.p['id']});
      setState(() => interest = {'status': r['autoAccepted'] == true ? 'accepted' : 'pending', 'direction': 'sent'});
      if (mounted) context.toast(context.tt('Interest sent 💌', 'रुचि भेज दी गई 💌'));
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.p;
    final lang = context.watch<AppState>().lang;
    final status = interest?['status'];
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileDetailScreen(id: p['profileId']))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(
            child: Stack(fit: StackFit.expand, children: [
              ProfileImage(url: p['photo'], gender: p['gender'], blur: p['photoLocked'] == true ? 12 : 0),
              const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.transparent, Colors.black87]))),
              if (p['photoLocked'] == true) const Center(child: Icon(Icons.lock, color: Colors.white, size: 30)),
              Positioned(
                left: 6,
                top: 6,
                child: Row(children: [
                  if (p['isPremium'] == true) const InfoChip('Premium', icon: Icons.star, bg: MsrColors.goldLight, fg: MsrColors.maroonDark),
                  if (p['isOnline'] == true) ...[const SizedBox(width: 4), const InfoChip('●', bg: MsrColors.green, fg: Colors.white)],
                ]),
              ),
              Positioned(
                right: 4,
                top: 4,
                child: IconButton.filledTonal(
                  style: IconButton.styleFrom(backgroundColor: Colors.white70, minimumSize: const Size(34, 34)),
                  onPressed: _shortlist,
                  icon: Icon(shortlisted ? Icons.favorite : Icons.favorite_border, size: 18, color: MsrColors.maroon),
                ),
              ),
              Positioned(
                left: 10,
                right: 10,
                bottom: 8,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Flexible(child: Text('${p['firstName']} ${p['lastName'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15))),
                    if (p['isVerified'] == true) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.verified, color: Colors.lightBlueAccent, size: 16)),
                  ]),
                  Text('${p['age']} ${context.tt('yrs', 'वर्ष')}${p['height'] != null ? ' · ${cmToFeet(p['height'])}' : ''} · ${p['district'] ?? p['state'] ?? ''}',
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                ]),
              ),
              if (p['matchScore'] != null)
                Positioned(right: 8, bottom: 44, child: InfoChip('${p['matchScore']}%', bg: MsrColors.goldLight, fg: MsrColors.maroonDark)),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('गोत्र: ${p['gotra'] ?? ''}', style: const TextStyle(fontSize: 12, color: MsrColors.maroon, fontWeight: FontWeight.w600)),
              Text(p['occupation'] ?? labelOf('employedIn', p['employedIn'], lang), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 2, 8, 8),
            child: SizedBox(
              height: 36,
              child: status == 'accepted'
                  ? OutlinedButton.icon(onPressed: null, icon: const Icon(Icons.check_circle, size: 16), label: Text(context.tt('Connected', 'जुड़े हुए'), style: const TextStyle(fontSize: 12)))
                  : status == 'pending'
                      ? OutlinedButton(onPressed: null, child: Text(interest?['direction'] == 'received' ? context.tt('Respond', 'जवाब दें') : context.tt('Sent', 'भेजी गई'), style: const TextStyle(fontSize: 12)))
                      : ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(padding: EdgeInsets.zero),
                          onPressed: busy || status == 'declined' ? null : _interest,
                          icon: const Icon(Icons.send, size: 15),
                          label: Text(context.tt('Send Interest', 'रुचि भेजें'), style: const TextStyle(fontSize: 12)),
                        ),
            ),
          ),
        ]),
      ),
    );
  }
}

/// Responsive grid of profile cards
class ProfileGrid extends StatelessWidget {
  final List items;
  final ScrollController? controller;
  final bool shrinkWrap;
  const ProfileGrid({super.key, required this.items, this.controller, this.shrinkWrap = false});
  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return GridView.builder(
      controller: controller,
      shrinkWrap: shrinkWrap,
      physics: shrinkWrap ? const NeverScrollableScrollPhysics() : null,
      padding: const EdgeInsets.all(12),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: w > 700 ? 4 : 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: .56),
      itemCount: items.length,
      itemBuilder: (_, i) => ProfileCard(key: ValueKey(items[i]['id']), p: Map<String, dynamic>.from(items[i])),
    );
  }
}
