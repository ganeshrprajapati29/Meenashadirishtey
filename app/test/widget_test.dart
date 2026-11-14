import 'package:flutter_test/flutter_test.dart';
import 'package:msr_app/core/labels.dart';

void main() {
  test('height conversion', () {
    expect(cmToFeet(170), "5'7\"");
  });
  test('labels', () {
    expect(labelOf('employedIn', 'government', 'hi'), 'सरकारी नौकरी');
    expect(labelOf('employedIn', 'government', 'en'), 'Government Job');
  });
}
