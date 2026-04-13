import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

import '../../domain/entities/customer_draft.dart';
import '../../domain/entities/customer_list_item.dart';

enum CustomerEditorSheetResult { saved, deleted }

class CustomerEditorSheet extends StatefulWidget {
  const CustomerEditorSheet({
    required this.title,
    required this.submitLabel,
    required this.onSubmitted,
    super.key,
    this.initialCustomer,
    this.onDeleteRequested,
    this.canDelete = false,
  });

  final String title;
  final String submitLabel;
  final CustomerListItem? initialCustomer;
  final Future<void> Function(CustomerDraft draft) onSubmitted;
  final Future<void> Function()? onDeleteRequested;
  final bool canDelete;

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
  bool _isDeleting = false;
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
                      onPressed: _isSubmitting || _isDeleting
                          ? null
                          : () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if ((_errorMessage ?? '').trim().isNotEmpty) ...[
                  AppAlertBanner(
                    title: 'Could not update customer',
                    message: _errorMessage!,
                  ),
                  const SizedBox(height: 16),
                ],
                AppTextField(
                  label: 'Customer Name',
                  controller: _nameController,
                  hintText: 'Daw Aye Aye',
                  prefixIcon: const Icon(Icons.person_outline_rounded),
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
                  prefixIcon: const Icon(Icons.call_outlined),
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
                  prefixIcon: const Icon(Icons.location_on_outlined),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Address',
                  controller: _addressController,
                  hintText: 'No. 12, Shwe Taung Gyar St',
                  prefixIcon: const Icon(Icons.home_outlined),
                  maxLines: 2,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Internal Note',
                  controller: _notesController,
                  hintText: 'Preferred delivery time or repeat-buyer note',
                  prefixIcon: const Icon(Icons.sticky_note_2_outlined),
                  maxLines: 3,
                  textInputAction: TextInputAction.done,
                ),
                if (widget.onDeleteRequested != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: const Color(0xFFFECDD3),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Delete customer',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFBE123C),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.canDelete
                              ? 'Remove this customer profile permanently.'
                              : 'Customers with order history cannot be deleted.',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMid,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed:
                                _isSubmitting ||
                                    _isDeleting ||
                                    !widget.canDelete
                                ? null
                                : _deleteCustomer,
                            icon: _isDeleting
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.delete_outline_rounded),
                            label: Text(
                              _isDeleting ? 'Deleting...' : 'Delete customer',
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFBE123C),
                              side: const BorderSide(
                                color: Color(0xFFFDA4AF),
                                width: 1.5,
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              textStyle: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        text: 'Cancel',
                        variant: AppButtonVariant.secondary,
                        onPressed: _isSubmitting || _isDeleting
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

      Navigator.of(context).pop(CustomerEditorSheetResult.saved);
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

  Future<void> _deleteCustomer() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete customer'),
          content: const Text(
            'Delete this customer permanently? This cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text(
                'Delete',
                style: TextStyle(color: Color(0xFFBE123C)),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true || widget.onDeleteRequested == null) {
      return;
    }

    setState(() {
      _isDeleting = true;
      _errorMessage = null;
    });

    try {
      await widget.onDeleteRequested!();

      if (!mounted) {
        return;
      }

      Navigator.of(context).pop(CustomerEditorSheetResult.deleted);
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
          _isDeleting = false;
        });
      }
    }
  }
}
