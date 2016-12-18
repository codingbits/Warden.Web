import {inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import TranslationService from 'resources/services/translation-service';
import UserService from 'resources/services/user-service';
import { ValidationControllerFactory,
  ValidationRules,
  validateTrigger  } from 'aurelia-validation';
import { MaterializeFormValidationRenderer } from 'aurelia-materialize-bridge';
import ToastService from 'resources/services/toast-service';
import LoaderService from 'resources/services/loader-service';
import {Router} from 'aurelia-router';

@inject(I18N, TranslationService, UserService, ToastService,
LoaderService, ValidationControllerFactory, Router)
export class SetNewPassword {
  constructor(i18n, translationService, userService, toast, loader, controllerFactory, router) {
    this.i18n = i18n;
    this.translationService = translationService;
    this.userService = userService;
    this.toast = toast;
    this.loader = loader;
    this.controller = controllerFactory.createForCurrentScope();
    this.controller.validateTrigger = validateTrigger.blur;
    this.controller.addRenderer(new MaterializeFormValidationRenderer());
    this.router = router;
    this.sending = false;
    this.password = '';

    ValidationRules
      .ensure('password')
        .required()
          .withMessage(this.translationService.tr('account.new_password_is_required'))
        .minLength(4)
          .withMessage(this.translationService.tr('account.new_password_is_invalid'))
        .maxLength(100)
          .withMessage(this.translationService.tr('account.new_password_is_invalid'))
      .on(this);
  }

  async activate(params) {
    this.email = params.email;
    this.token = params.token;
    if (!this.email || !this.token) {
      return new Redirect('');
    }
  }

  async submit() {
    let errors = await this.controller.validate();
    if (errors.length > 0) {
      this.sending = false;

      return;
    }

    this.loader.display();
    this.sending = true;
    this.toast.info(this.translationService.tr('account.setting_new_password'));
    let newPasswordSet = await this.userService.setNewPassword(
      this.email, this.token, this.password);
    if (newPasswordSet.success) {
      this.toast.success(this.translationService.tr('account.new_password_set'));
      this.loader.hide();
      this.router.navigateToRoute('sign-in');

      return;
    }

    this.sending = false;
    this.loader.hide();
    this.toast.error(this.translationService.trCode(newPasswordSet.code));
  }
}
