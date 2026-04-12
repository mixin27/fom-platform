import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

import '../../domain/entities/customer_draft.dart';
import '../../domain/entities/customer_list_item.dart';

class CustomerEditorSheet extends StatefulWidget {
  const CustomerEditorSheet({
    required this.title,
    required this.submitLabel,
    required this.onSubmitted,
    super.key,
    this.initialCustomer,
  });

  final String title;
  final String submitLabel;
  final CustomerListItem? initialCustomer;
  final Future<void> Function(CustomerDraft draft) onSubmitted;

  @override
  State<CustomerEditorSheet> createState() => _CustomerEditorSheetState();
}

class _CustomerEditorSheetState extends State<CustomerEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _townshipController;
  late final TextEditingController _addressController;
  late final TextEditingController _notesController;

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final customer = widget.initialCustomer;
    _nameController = TextEditingController(text: customer?.name ?? '');
    _phoneController = TextEditingController(text: customer?.phone ?? '');
    _townshipController = TextEditingController(text: customer?.township ?? '');
    _addressController = TextEditingController(text: customer?.address ?? '');
    _notesController = TextEditingController(text: customer?.notes ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _townshipController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: AppColors.textDark,
                        ),
                      ),
                    ),
                    AppIconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: _isSubmitting
                          ? null
                          : () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if ((_errorMessage ?? '').trim().isNotEmpty) ...[
                  AppAlertBanner(
                    title: 'Could not save customer',
                    message: _errorMessage!,
                  ),
                  const SizedBox(height: 16),
                ],
                AppTextField(
                  label: 'Customer Name',
                  controller: _nameController,
                  hintText: 'Daw Aye Aye',
                  prefixIcon: const Text('👤', style: TextStyle(fontSize: 16)),
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    final normalized = value?.trim() ?? '';
                    if (normalized.length < 2) {
                      return 'Enter a customer name';
                    }

                    return null;
                  },
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Phone',
                  controller: _phoneController,
                  hintText: '09 9871 2345',
                  prefixIcon: const Text('📞', style: TextStyle(fontSize: 16)),
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    final normalized = value?.trim() ?? '';
                    if (normalized.length < 5) {
                      return 'Enter a valid phone number';
                    }

                    return null;
                  },
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Township',
                  controller: _townshipController,
                  hintText: 'Hlaing',
                  prefixIcon: const Text('📍', style: TextStyle(fontSize: 16)),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Address',
                  controller: _addressController,
                  hintText: 'No. 12, Shwe Taung Gyar St',
                  prefixIcon: const Text('🏠', style: TextStyle(fontSize: 16)),
                  maxLines: 2,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Internal Note',
                  controller: _notesController,
                  hintText: 'Preferred delivery time or repeat-buyer note',
                  prefixIcon: const Text('📝', style: TextStyle(fontSize: 16)),
                  maxLines: 3,
                  textInputAction: TextInputAction.done,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        text: 'Cancel',
                        variant: AppButtonVariant.secondary,
                        onPressed: _isSubmitting
                            ? null
                            : () => Navigator.of(context).pop(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppButton(
                        text: widget.submitLabel,
                        isLoading: _isSubmitting,
                        onPressed: _submit,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final formState = _formKey.currentState;
    if (formState == null || !formState.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await widget.onSubmitted(
        CustomerDraft(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          township: _normalizeOptional(_townshipController.text),
          address: _normalizeOptional(_addressController.text),
          notes: _normalizeOptional(_notesController.text),
        ),
      );

      if (!mounted) {
        return;
      }

      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String? _normalizeOptional(String value) {
    final normalized = value.trim();
    return normalized.isEmpty ? null : normalized;
  }
}
