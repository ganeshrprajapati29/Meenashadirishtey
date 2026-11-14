import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../widgets/common.dart';

class PhotosScreen extends StatefulWidget {
  final bool onboarding;
  const PhotosScreen({super.key, this.onboarding = false});
  @override
  State<PhotosScreen> createState() => _PhotosScreenState();
}

class _PhotosScreenState extends State<PhotosScreen> {
  List photos = [];
  bool loading = true;
  bool uploading = false;

  @override
  void initState() {
    super.initState();
    Api.I.get('/profiles/me').then((r) => setState(() {
          photos = r['profile']?['photos'] ?? [];
          loading = false;
        }));
  }

  Future<void> _pick() async {
    final files = await ImagePicker().pickMultiImage(imageQuality: 85, maxWidth: 1600, limit: 6 - photos.length);
    if (files.isEmpty) return;
    setState(() => uploading = true);
    try {
      final form = FormData();
      for (final f in files.take(6 - photos.length)) {
        form.files.add(MapEntry('photos', await MultipartFile.fromFile(f.path, filename: f.name)));
      }
      final r = await Api.I.post('/profiles/me/photos', form);
      setState(() => photos = r['photos']);
      if (mounted) context.toast(context.tt('Photo uploaded', 'फोटो अपलोड हो गई'));
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    } finally {
      if (mounted) setState(() => uploading = false);
    }
  }

  Future<void> _primary(String id) async {
    final r = await Api.I.patch('/profiles/me/photos/$id/primary');
    setState(() => photos = r['photos']);
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
          title: Text(context.tt('Delete photo?', 'फोटो हटाएं?')),
          actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('No')), TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Yes'))],
        ));
    if (ok != true) return;
    final r = await Api.I.delete('/profiles/me/photos/$id');
    setState(() => photos = r['photos']);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.tt('My Photos', 'मेरी फोटो'))),
      body: loading
          ? const Loading()
          : ListView(padding: const EdgeInsets.all(16), children: [
              if (widget.onboarding)
                Container(
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(14)),
                  child: Text(context.tt('🎉 Profile created! It will be live after review. Add clear photos to get 10x more responses.', '🎉 प्रोफाइल बन गई! जांच के बाद लाइव होगी। साफ फोटो जोड़ें – 10 गुना ज़्यादा जवाब मिलेंगे।')),
                ),
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: .8,
                children: [
                  ...photos.map((p) => ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Stack(fit: StackFit.expand, children: [
                          ProfileImage(url: p['url']),
                          if (p['isPrimary'] == true) const Positioned(left: 4, top: 4, child: InfoChip('★', bg: MsrColors.goldLight)),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Row(children: [
                              if (p['isPrimary'] != true) IconButton(onPressed: () => _primary(p['_id']), icon: const Icon(Icons.star, color: MsrColors.goldLight)),
                              IconButton(onPressed: () => _delete(p['_id']), icon: const Icon(Icons.delete, color: Colors.white)),
                            ]),
                          ),
                        ]),
                      )),
                  if (photos.length < 6)
                    InkWell(
                      onTap: uploading ? null : _pick,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: MsrColors.maroon.withValues(alpha: .4), width: 1.5), color: MsrColors.maroonLight),
                        child: Center(child: uploading ? const CircularProgressIndicator(color: MsrColors.maroon) : Column(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.add_a_photo, color: MsrColors.maroon, size: 30), const SizedBox(height: 6), Text('${photos.length}/6')])),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 24),
              if (widget.onboarding) ElevatedButton(onPressed: () => Navigator.pop(context), child: Text(photos.isEmpty ? context.tt('Skip for now', 'अभी छोड़ें') : context.tt('Continue', 'आगे बढ़ें'))),
            ]),
    );
  }
}
