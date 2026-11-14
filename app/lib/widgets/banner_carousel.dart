import 'package:carousel_slider/carousel_slider.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../services/api.dart';
import 'common.dart';

/// Dynamic banners / ads managed from the admin panel (placement app_home etc.)
class BannerCarousel extends StatefulWidget {
  final String placement;
  final void Function(String link)? onInternalLink;
  const BannerCarousel({super.key, this.placement = 'app_home', this.onInternalLink});
  @override
  State<BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<BannerCarousel> {
  List items = [];
  int index = 0;

  @override
  void initState() {
    super.initState();
    Api.I.get('/public/banners', {'placement': widget.placement}).then((r) {
      if (mounted) setState(() => items = r['items'] ?? []);
    }).catchError((_) {});
  }

  void _open(Map b) {
    Api.I.post('/public/banners/${b['_id']}/click').catchError((_) => <String, dynamic>{});
    final link = b['link']?.toString() ?? '';
    if (link.isEmpty) return;
    if (link.startsWith('http')) {
      launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
    } else {
      widget.onInternalLink?.call(link);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(children: [
      CarouselSlider(
        items: items.map<Widget>((b) {
          return GestureDetector(
            onTap: () => _open(b),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), gradient: MsrColors.royal),
              child: Stack(fit: StackFit.expand, children: [
                if ((b['image'] ?? '').toString().isNotEmpty)
                  ProfileImage(url: b['image'])
                else
                  Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(b['title'] ?? '', style: displayStyle(20, color: Colors.white)),
                      Text(b['subtitle'] ?? '', style: const TextStyle(color: Colors.white70)),
                    ]),
                  ),
                if (b['isAd'] == true)
                  Positioned(right: 8, top: 8, child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), color: Colors.black38, child: const Text('Ad', style: TextStyle(color: Colors.white, fontSize: 10)))),
              ]),
            ),
          );
        }).toList(),
        options: CarouselOptions(
          aspectRatio: 16 / 5,
          viewportFraction: .94,
          autoPlay: items.length > 1,
          autoPlayInterval: const Duration(seconds: 5),
          onPageChanged: (i, _) => setState(() => index = i),
        ),
      ),
      if (items.length > 1)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(items.length, (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                height: 6,
                width: i == index ? 20 : 6,
                decoration: BoxDecoration(color: i == index ? MsrColors.maroon : MsrColors.gold.withValues(alpha: .4), borderRadius: BorderRadius.circular(4)),
              ))),
        ),
    ]);
  }
}
