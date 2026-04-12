import 'package:equatable/equatable.dart';

class SettingsShopProfile extends Equatable {
  const SettingsShopProfile({
    required this.id,
    required this.name,
    required this.timezone,
    required this.memberCount,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String timezone;
  final int memberCount;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
    id,
    name,
    timezone,
    memberCount,
    createdAt,
  ];
}
