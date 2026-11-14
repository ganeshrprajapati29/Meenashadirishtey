/// Enum labels in English / Hindi (mirrors the website)
const Map<String, Map<String, List<String>>> kLabels = {
  'createdFor': {'self': ['Self', 'स्वयं'], 'son': ['Son', 'बेटा'], 'daughter': ['Daughter', 'बेटी'], 'brother': ['Brother', 'भाई'], 'sister': ['Sister', 'बहन'], 'relative': ['Relative', 'रिश्तेदार'], 'friend': ['Friend', 'मित्र']},
  'gender': {'male': ['Male (Groom)', 'पुरुष (वर)'], 'female': ['Female (Bride)', 'महिला (वधू)']},
  'maritalStatus': {'never_married': ['Never Married', 'अविवाहित'], 'divorced': ['Divorced', 'तलाकशुदा'], 'widowed': ['Widowed', 'विधुर/विधवा'], 'awaiting_divorce': ['Awaiting Divorce', 'तलाक प्रक्रिया में']},
  'employedIn': {'government': ['Government Job', 'सरकारी नौकरी'], 'private': ['Private Job', 'प्राइवेट नौकरी'], 'business': ['Business', 'व्यवसाय'], 'self_employed': ['Self Employed', 'स्वरोजगार'], 'defence': ['Defence / Army', 'सेना / रक्षा'], 'not_working': ['Not Working', 'कार्यरत नहीं'], 'student': ['Student', 'विद्यार्थी']},
  'diet': {'veg': ['Vegetarian', 'शाकाहारी'], 'non_veg': ['Non-Vegetarian', 'मांसाहारी'], 'eggetarian': ['Eggetarian', 'अंडाहारी']},
  'complexion': {'very_fair': ['Very Fair', 'बहुत गोरा'], 'fair': ['Fair', 'गोरा'], 'wheatish': ['Wheatish', 'गेहुंआ'], 'dark': ['Dark', 'सांवला']},
  'familyType': {'joint': ['Joint Family', 'संयुक्त परिवार'], 'nuclear': ['Nuclear Family', 'एकल परिवार']},
  'familyStatus': {'middle_class': ['Middle Class', 'मध्यम वर्ग'], 'upper_middle_class': ['Upper Middle Class', 'उच्च मध्यम वर्ग'], 'rich': ['Rich', 'संपन्न'], 'affluent': ['Affluent', 'अति संपन्न']},
  'manglik': {'no': ['No', 'नहीं'], 'yes': ['Yes', 'हाँ'], 'anshik': ['Anshik', 'आंशिक'], 'dont_know': ["Don't Know", 'पता नहीं']},
};

String labelOf(String group, dynamic value, String lang) {
  final row = kLabels[group]?[value?.toString()];
  if (row == null) return value?.toString() ?? '—';
  return lang == 'hi' ? row[1] : row[0];
}

String cmToFeet(dynamic cm) {
  if (cm == null) return '';
  final inches = ((cm as num) / 2.54).round();
  return "${inches ~/ 12}'${inches % 12}\"";
}

String timeAgo(dynamic date, String lang) {
  if (date == null) return '';
  final d = DateTime.tryParse(date.toString());
  if (d == null) return '';
  final s = DateTime.now().difference(d.toLocal()).inSeconds;
  final hi = lang == 'hi';
  if (s < 60) return hi ? 'अभी' : 'just now';
  final m = s ~/ 60;
  if (m < 60) return hi ? '$m मिनट पहले' : '${m}m ago';
  final h = m ~/ 60;
  if (h < 24) return hi ? '$h घंटे पहले' : '${h}h ago';
  final dd = h ~/ 24;
  return hi ? '$dd दिन पहले' : '${dd}d ago';
}
