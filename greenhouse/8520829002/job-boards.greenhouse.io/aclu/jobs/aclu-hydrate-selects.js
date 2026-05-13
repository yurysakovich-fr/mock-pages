/**
 * Оживляет combobox Greenhouse (react-select) без React: те же классы select__*,
 * опции из aclu-form-fields.json и countries.json; строки ошибок из aclu-job-post-en.json
 * (копия CDN job_post locale: job-boards.cdn.greenhouse.io/locales/en/job_post.*.json).
 */
(function () {
  var LOCALE = null;
  var FALLBACK = {
    "application.field_is_required": "This field is required.",
    "application.is_required": "{{ fieldName }} is required.",
    "application.missing_country": "Select a country",
    "application.invalid_email": "Please enter a valid email address (example@domain.com).",
    "application.errors.invalid_filetype": "Invalid file format selected.",
    "file_upload.invalid_file_size": "{{ file_size }} MB maximum file size.",
    "file_upload.attach": "Attach",
    "file_upload.manually": "Enter manually",
    "file_upload.remove_file": "Remove",
    "file_upload.aria.attach": "Attach {{ label }}.",
    "file_upload.aria.manual": "Enter {{ label }} manually.",
    "select.placeholder": "Select...",
    "select.toggle_flyout": "Toggle flyout",
  };

  function t(path) {
    var fb = FALLBACK[path];
    if (!LOCALE) return fb != null ? fb : "";
    var parts = path.split(".");
    var o = LOCALE;
    for (var i = 0; i < parts.length; i++) {
      if (o == null) return fb != null ? fb : "";
      o = o[parts[i]];
    }
    return typeof o === "string" ? o : fb != null ? fb : "";
  }

  /** Подстановка {{ key }} как в L() на job-board (job_post locale). */
  function interpolateTemplate(str, vars) {
    if (!str || !vars) return str || "";
    return String(str).replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : "";
    });
  }

  /** Как Zr в Field (input_file): лимит 100 MB, см. te(De), De=100. */
  var GH_FILE_MAX_MB = 100;
  var GH_FILE_MAX_BYTES = GH_FILE_MAX_MB * 1024 * 1024;
  var GH_FILE_ALLOWED_EXT = ["pdf", "doc", "docx", "txt", "rtf"];

  function isAcluGreenhouseFileField(el) {
    if (!el || el.tagName !== "INPUT") return false;
    var typ = (el.getAttribute("type") || "").toLowerCase();
    if (typ !== "file") return false;
    var eid = el.id || "";
    return eid === "resume" || eid === "cover_letter";
  }

  function fileUploadFieldRequired(el) {
    var g = el && el.closest && el.closest(".file-upload");
    return !!(g && g.getAttribute("aria-required") === "true");
  }

  function extensionFromFileName(name) {
    var n = String(name || "");
    var dot = n.lastIndexOf(".");
    if (dot < 0) return "";
    return n.slice(dot + 1).toLowerCase().trim();
  }

  /**
   * Размер и расширение как Zr (client) на job-board.
   * @returns {{ ok: boolean, message: string }}
   */
  function validateSelectedFileList(files) {
    if (!files || !files.length) return { ok: true, message: "" };
    var f = files[0];
    if (f.size > GH_FILE_MAX_BYTES) {
      return {
        ok: false,
        message: interpolateTemplate(t("file_upload.invalid_file_size"), { file_size: String(GH_FILE_MAX_MB) }),
      };
    }
    var ext = extensionFromFileName(f.name);
    if (!ext || GH_FILE_ALLOWED_EXT.indexOf(ext) === -1) {
      return { ok: false, message: t("application.errors.invalid_filetype") };
    }
    return { ok: true, message: "" };
  }

  /**
   * Как Ia для resume/cover_letter: файл ИЛИ *_text; размер/тип как Zr при выборе файла.
   * @returns {{ ok: boolean, message: string }}
   */
  function validateAcluGreenhouseFileField(form, el) {
    if (!form || !el) return { ok: true, message: "" };
    var required = fileUploadFieldRequired(el);
    var textEl = form.querySelector("#" + el.id + "_text");
    var hasText = !!(textEl && String(textEl.value || "").trim());
    var files = el.files;
    var hasFile = !!(files && files.length > 0);

    if (!hasFile && !hasText) {
      if (required) {
        var blk = el.closest(".file-upload");
        var lab = blk ? uploadLabelPlainText(blk) : "";
        var raw = t("application.is_required");
        var msg = interpolateTemplate(raw, { fieldName: lab || el.name || el.id });
        return { ok: false, message: msg && msg.trim() ? msg : t("application.field_is_required") };
      }
      return { ok: true, message: "" };
    }
    if (hasText && !hasFile) return { ok: true, message: "" };
    return validateSelectedFileList(files);
  }

  function uploadLabelPlainText(block) {
    var lab = block.querySelector(".upload-label");
    if (!lab) return "";
    var c = lab.cloneNode(true);
    var req = c.querySelector(".required");
    if (req) req.remove();
    return String(c.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function ensureFileUploadFilenameRow(block, fileInput) {
    var row = block.querySelector("[data-aclu-rs-filename-row]");
    if (row) return row;
    row = document.createElement("div");
    row.className = "file-upload__filename";
    row.setAttribute("data-aclu-rs-filename-row", "1");
    row.setAttribute("role", "status");
    row.hidden = true;

    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "13");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(ns, "path");
    path.setAttribute(
      "d",
      "M9 1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6l-5-5zm0 1.4L12.6 6H10a1 1 0 0 1-1-1V2.4zM4 2h5v3a2 2 0 0 0 2 2h3v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
    );
    svg.appendChild(path);

    var nameP = document.createElement("p");
    nameP.className = "body";
    nameP.setAttribute("data-aclu-file-name", "1");

    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn btn--pill";
    rm.setAttribute("data-aclu-file-remove", "1");
    rm.textContent = t("file_upload.remove_file");

    row.appendChild(svg);
    row.appendChild(nameP);
    row.appendChild(rm);

    rm.addEventListener("click", function (ev) {
      ev.preventDefault();
      fileInput.value = "";
      row.hidden = true;
      nameP.textContent = "";
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    var wrap = block.querySelector(".file-upload__wrapper");
    var btnCont = wrap && wrap.querySelector(".button-container");
    if (btnCont && btnCont.parentNode) btnCont.insertAdjacentElement("afterend", row);
    else if (wrap) wrap.appendChild(row);

    return row;
  }

  function updateFileUploadFilenameRow(block, fileInput, fileNameOrNull) {
    var row = ensureFileUploadFilenameRow(block, fileInput);
    var nameP = row.querySelector("[data-aclu-file-name]");
    if (!fileNameOrNull) {
      row.hidden = true;
      if (nameP) nameP.textContent = "";
      return;
    }
    row.hidden = false;
    if (nameP) nameP.textContent = fileNameOrNull;
  }

  function ensureManualEntryArea(block, fileInput) {
    var textId = fileInput.id + "_text";
    var wrap = block.querySelector(".text-input-wrapper[data-aclu-manual-wrap]");
    if (wrap) return wrap;

    wrap = document.createElement("div");
    wrap.className = "text-input-wrapper";
    wrap.setAttribute("data-aclu-manual-wrap", "1");
    wrap.hidden = true;

    var iw = document.createElement("div");
    iw.className = "input-wrapper";

    var label = document.createElement("label");
    label.className = "label label";
    label.id = textId + "-label";
    label.htmlFor = textId;
    label.textContent = uploadLabelPlainText(block);

    var ta = document.createElement("textarea");
    ta.id = textId;
    ta.name = textId;
    ta.className = "input input__multi-line";
    ta.setAttribute("rows", "8");
    ta.setAttribute("aria-labelledby", label.id);
    ta.setAttribute("aria-describedby", textId + "-error");
    ta.setAttribute("aria-invalid", "false");

    iw.appendChild(label);
    iw.appendChild(ta);
    wrap.appendChild(iw);

    var ft = block.querySelector(".file-upload__filetypes");
    if (ft && ft.parentNode) ft.insertAdjacentElement("afterend", wrap);
    else if (block.querySelector(".file-upload__wrapper")) block.querySelector(".file-upload__wrapper").appendChild(wrap);

    return wrap;
  }

  /**
   * Кнопка Attach → click на скрытом input[type=file]; имя файла в .file-upload__filename; Remove; Enter manually → textarea.
   */
  function bindAcluFileUploadUi(form) {
    if (!form || form.dataset.acluFileUploadUi) return;
    form.dataset.acluFileUploadUi = "1";

    form.querySelectorAll(".file-upload").forEach(function (block) {
      if (block.dataset.acluFileUploadBound) return;
      var input = block.querySelector('input[type="file"][id]');
      if (!input || !isAcluGreenhouseFileField(input)) return;
      block.dataset.acluFileUploadBound = "1";

      if (!input.getAttribute("name")) input.setAttribute("name", input.id);

      var secButtons = block.querySelectorAll(".button-container > .secondary-button");
      var attachBtn = secButtons[0] && secButtons[0].querySelector("button.btn--pill");
      var manualBtn = secButtons[1] && secButtons[1].querySelector("button.btn--pill");
      var uplPlain = uploadLabelPlainText(block);

      var ft = block.querySelector(".file-upload__filetypes");
      if (ft && ft.id === "accepted-filetypes") ft.id = input.id + "-accepted-filetypes";

      if (attachBtn) {
        attachBtn.textContent = t("file_upload.attach");
        attachBtn.setAttribute(
          "aria-label",
          interpolateTemplate(t("file_upload.aria.attach"), { label: uplPlain || input.id })
        );
        attachBtn.addEventListener("click", function (ev) {
          ev.preventDefault();
          input.click();
        });
      }

      if (manualBtn) {
        manualBtn.textContent = t("file_upload.manually");
        manualBtn.setAttribute("aria-expanded", "false");
        manualBtn.setAttribute(
          "aria-label",
          interpolateTemplate(t("file_upload.aria.manual"), { label: uplPlain || input.id })
        );
        manualBtn.addEventListener("click", function (ev) {
          ev.preventDefault();
          var area = ensureManualEntryArea(block, input);
          var isOpen = !area.hidden;
          if (isOpen) {
            area.hidden = true;
            var taClose = area.querySelector("textarea");
            if (taClose) taClose.value = "";
            manualBtn.setAttribute("aria-expanded", "false");
          } else {
            input.value = "";
            updateFileUploadFilenameRow(block, input, null);
            setFieldHelperError(input.id, "", false, input);
            input.setAttribute("aria-invalid", "false");
            area.hidden = false;
            manualBtn.setAttribute("aria-expanded", "true");
            var taOpen = area.querySelector("textarea");
            if (taOpen) taOpen.focus();
          }
        });
      }

      input.addEventListener("change", function () {
        var list = input.files;
        if (list && list.length) {
          var vr = validateSelectedFileList(list);
          if (!vr.ok) {
            setFieldHelperError(input.id, vr.message, true, input);
            input.setAttribute("aria-invalid", "true");
            input.value = "";
            updateFileUploadFilenameRow(block, input, null);
            return;
          }
          setFieldHelperError(input.id, "", false, input);
          input.setAttribute("aria-invalid", "false");
          var areaM = block.querySelector(".text-input-wrapper[data-aclu-manual-wrap]");
          if (areaM) {
            areaM.hidden = true;
            var taM = areaM.querySelector("textarea");
            if (taM) taM.value = "";
          }
          if (manualBtn) manualBtn.setAttribute("aria-expanded", "false");
          updateFileUploadFilenameRow(block, input, list[0].name);
          return;
        }
        updateFileUploadFilenameRow(block, input, null);
      });
    });
  }

  function ensureFieldErrorEl(fieldId, anchorEl) {
    var errId = fieldId + "-error";
    var existing = document.getElementById(errId);
    if (existing) return existing;
    var p = document.createElement("p");
    p.id = errId;
    p.className = "helper-text helper-text--error";
    p.setAttribute("aria-live", "polite");
    p.hidden = true;
    var selectRoot = anchorEl && anchorEl.closest && anchorEl.closest(".select");
    if (selectRoot) {
      selectRoot.appendChild(p);
      return p;
    }
    var fileUp = anchorEl && anchorEl.closest && anchorEl.closest(".file-upload");
    if (fileUp) {
      fileUp.appendChild(p);
      return p;
    }
    var wrap = anchorEl && anchorEl.closest && anchorEl.closest(".text-input-wrapper");
    var iw = wrap && wrap.querySelector(".input-wrapper");
    if (iw && wrap) {
      wrap.insertBefore(p, iw.nextSibling);
      return p;
    }
    var fw = anchorEl && anchorEl.closest && anchorEl.closest(".field-wrapper");
    if (fw) {
      fw.appendChild(p);
      return p;
    }
    return null;
  }

  function setFieldHelperError(fieldId, message, show, anchorEl) {
    var el = ensureFieldErrorEl(fieldId, anchorEl);
    if (!el) return;
    el.textContent = show ? message : "";
    el.hidden = !show;
  }

  function comboboxAriaDescribedby(input, placeholderEl, fieldId, includeError) {
    if (!input || !placeholderEl) return;
    var parts = [placeholderEl.id];
    if (includeError) parts.push(fieldId + "-error");
    input.setAttribute("aria-describedby", parts.join(" ").trim());
  }

  function dropdownButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-button icon-button--sm";
    btn.setAttribute("aria-label", t("select.toggle_flyout"));
    btn.tabIndex = -1;
    btn.innerHTML =
      '<svg class="svg-icon" fill="none" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path class="icon--primary-color" d="M11.4534 16.0667L5.90983 9.13729C5.54316 8.67895 5.86948 8 6.45644 8H17.5436C18.1305 8 18.4568 8.67895 18.0902 9.13729L12.5466 16.0667C12.2664 16.417 11.7336 16.417 11.4534 16.0667Z"></path></svg>';
    return btn;
  }

  function clearComboboxVisualError(shell) {
    if (!shell) return;
    var c = shell.querySelector(".select__control");
    var inp = shell.querySelector("input.select__input");
    var container = shell.closest(".select__container");
    var lab = container && container.querySelector("label.select__label");
    if (c) c.classList.remove("select__control--error");
    if (lab) lab.classList.remove("select__label--error");
    if (inp) {
      inp.setAttribute("aria-invalid", "false");
      inp.setCustomValidity("");
    }
    var hid = shell.querySelector('input[type="hidden"][name]');
    if (hid && hid.name) {
      setFieldHelperError(hid.name, "", false, shell);
      var ph0 = shell.querySelector(".select__placeholder");
      if (inp && ph0) comboboxAriaDescribedby(inp, ph0, hid.name, false);
    }
  }

  function setComboboxVisualError(shell, on) {
    if (!shell) return;
    var c = shell.querySelector(".select__control");
    var inp = shell.querySelector("input.select__input");
    var container = shell.closest(".select__container");
    var lab = container && container.querySelector("label.select__label");
    if (c) c.classList.toggle("select__control--error", on);
    if (lab) lab.classList.toggle("select__label--error", on);
    if (inp) inp.setAttribute("aria-invalid", on ? "true" : "false");
  }

  /** В снимке HTML только aria-required; без нативного required браузер не валидирует. */
  function syncAriaRequiredToNative(form) {
    if (!form) return;
    form.querySelectorAll('[aria-required="true"]').forEach(function (el) {
      if (el.closest(".select-shell[data-aclu-rs-hydrated]")) return;
      var tag = el.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;
      var type = (el.getAttribute("type") || "").toLowerCase();
      if (type === "hidden" || type === "button" || type === "reset" || type === "submit") return;
      el.required = true;
    });
  }

  /** Как в job-board renderer: отступ сверху при scrollTo (~Pa=120 в entry.client). */
  var GH_SCROLL_OFFSET_PX = 120;

  function scrollLikeGreenhouse(el) {
    if (!el || typeof el.getBoundingClientRect !== "function") return;
    var y = el.getBoundingClientRect().top + window.scrollY - GH_SCROLL_OFFSET_PX;
    if (y < 0) y = 0;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /**
   * Кнопка «Apply» в шапке вакансии (не submit формы): скролл к заявке, фокус на первое поле, hash — как на job-board Greenhouse.
   */
  function bindAcluApplyHeroButtons(form) {
    if (!form || document.body.dataset.acluApplyHero) return;
    document.body.dataset.acluApplyHero = "1";
    document.querySelectorAll('button.btn--pill[aria-label="Apply"]').forEach(function (btn) {
      if (btn.closest("#application-form")) return;
      btn.addEventListener("click", function (ev) {
        if (ev.button !== 0) return;
        ev.preventDefault();
        scrollLikeGreenhouse(form);
        var first =
          form.querySelector("#first_name") || form.querySelector("input.input__single-line:not([type='hidden'])");
        requestAnimationFrame(function () {
          if (first && typeof first.focus === "function") first.focus({ preventScroll: true });
        });
        try {
          if (history && history.replaceState) {
            history.replaceState(null, "", window.location.pathname + window.location.search + "#application-form");
          }
        } catch (e) {}
      });
    });
  }

  /**
   * Порядок селектора как в useEffect после ошибок: aria-invalid | data-error | .helper-text--error
   */
  function firstScrollTargetInForm(form) {
    var list = form.querySelectorAll('[aria-invalid="true"], [data-error="true"], .helper-text--error');
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n.classList.contains("helper-text--error")) {
        if (n.hidden || !n.textContent || !String(n.textContent).trim()) continue;
      }
      return n;
    }
    return form.querySelector('[aria-invalid="true"], [data-error="true"]');
  }

  function fieldIdFor(el) {
    return el.id || el.name || "";
  }

  /**
   * Та же проверка, что в Ha/Ia (job-board renderer): для email не полагаемся на type=email в снимке HTML.
   * @see Ia() — /^([a-zA-Z0-9_.\-+'])*[\w+]@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
   */
  var GH_EMAIL_RE = /^([a-zA-Z0-9_.\-+'])*[\w+]@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

  function isGreenhouseEmailField(el) {
    if (!el || el.tagName !== "INPUT") return false;
    var typ = (el.getAttribute("type") || "").toLowerCase();
    var nm = (el.getAttribute("name") || "").toLowerCase();
    var eid = (el.getAttribute("id") || "").toLowerCase();
    var ac = (el.getAttribute("autoComplete") || "").toLowerCase();
    return typ === "email" || nm === "email" || eid === "email" || ac === "email";
  }

  function isGreenhouseEmailValueOk(el) {
    var trimmed = String(el.value || "").trim();
    if (!trimmed) return !el.required;
    return GH_EMAIL_RE.test(trimmed);
  }

  /**
   * Один проход при submit (как Ha + state в React): все combobox + нативные поля,
   * novalidate чтобы событие submit всегда доходило и можно показать все ошибки.
   */
  function bindAcluFormValidation(form) {
    if (!form || form.dataset.acluFormValidation) return;
    form.dataset.acluFormValidation = "1";
    form.noValidate = true;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();

      var shells = form.querySelectorAll(".select-shell[data-aclu-rs-hydrated]");
      shells.forEach(function (s) {
        var v = s.querySelector("input.select__input");
        if (v) v.setCustomValidity("");
      });

      var anyInvalid = false;
      var firstInvalidFocus = null;

      shells.forEach(function (shell) {
        var hidden = shell.querySelector('input[type="hidden"][name]');
        var vis = shell.querySelector("input.select__input");
        var need = hidden && hidden.getAttribute("data-aclu-required") === "1";
        var bad = need && !hidden.value;
        if (bad) {
          anyInvalid = true;
          if (vis && !firstInvalidFocus) firstInvalidFocus = vis;
          var msg =
            hidden.name === "country" ? t("application.missing_country") : t("application.field_is_required");
          setComboboxVisualError(shell, true);
          setFieldHelperError(hidden.name, msg, true, shell);
          var ph = shell.querySelector(".select__placeholder");
          if (vis && ph) comboboxAriaDescribedby(vis, ph, hidden.name, true);
        } else {
          setComboboxVisualError(shell, false);
          if (vis) vis.setCustomValidity("");
          if (hidden && hidden.name) {
            setFieldHelperError(hidden.name, "", false, shell);
            var ph2 = shell.querySelector(".select__placeholder");
            if (vis && ph2) comboboxAriaDescribedby(vis, ph2, hidden.name, false);
          }
        }
      });

      var nodes = form.querySelectorAll("input, select, textarea");
      for (var j = 0; j < nodes.length; j++) {
        var el = nodes[j];
        if (el.disabled) continue;
        if (el.closest(".select-shell[data-aclu-rs-hydrated]")) continue;
        var typ = (el.getAttribute("type") || "").toLowerCase();
        if (typ === "hidden" || typ === "button" || typ === "reset" || typ === "submit") continue;

        var fid = fieldIdFor(el);
        var invalid = false;
        var msg = "";

        if (isGreenhouseEmailField(el)) {
          var tr = String(el.value || "").trim();
          if (el.required && !tr) {
            invalid = true;
            msg = t("application.field_is_required");
          } else if (tr && !GH_EMAIL_RE.test(tr)) {
            invalid = true;
            msg = t("application.invalid_email");
          }
        } else if (isAcluGreenhouseFileField(el)) {
          var fv = validateAcluGreenhouseFileField(form, el);
          if (!fv.ok) {
            invalid = true;
            msg = fv.message;
          }
        } else if (!el.willValidate) {
          continue;
        } else if (!el.checkValidity()) {
          invalid = true;
          msg = messageForNativeInvalid(el);
        }

        if (invalid) {
          anyInvalid = true;
          if (!firstInvalidFocus) firstInvalidFocus = el;
          if (fid) setFieldHelperError(fid, msg, true, el);
          el.setAttribute("aria-invalid", "true");
        } else {
          if (fid) {
            setFieldHelperError(fid, "", false, el);
            el.setAttribute("aria-invalid", "false");
          }
        }
      }

      if (anyInvalid) {
        requestAnimationFrame(function () {
          var scrollEl = firstScrollTargetInForm(form);
          if (scrollEl) scrollLikeGreenhouse(scrollEl);
          var fe = firstInvalidFocus;
          if (fe && typeof fe.focus === "function") fe.focus({ preventScroll: !!scrollEl });
        });
        return;
      }

      var successHref = (form.getAttribute("data-aclu-success-href") || "").trim() || "./8520829002-success.html";
      window.location.assign(successHref);
    });
  }

  function messageForNativeInvalid(input) {
    var v = input.validity;
    if (!v) return t("application.field_is_required");
    var typ = (input.getAttribute("type") || "").toLowerCase();
    if (v.valueMissing) return t("application.field_is_required");
    if (typ === "email" && (v.typeMismatch || v.badInput)) return t("application.invalid_email");
    if (v.typeMismatch) return typ === "email" ? t("application.invalid_email") : t("application.field_is_required");
    return t("application.field_is_required");
  }

  function bindAcluNativeFieldValidation(form) {
    if (!form || form.dataset.acluNativeValidation) return;
    form.dataset.acluNativeValidation = "1";

    function clearPairedFileUploadIfValid(input) {
      if (!input || input.tagName !== "TEXTAREA" || !input.id || !/_text$/.test(input.id)) return;
      var form = input.form;
      if (!form) return;
      var base = input.id.replace(/_text$/, "");
      var fileIn = form.querySelector("#" + base);
      if (!fileIn || !isAcluGreenhouseFileField(fileIn)) return;
      if (validateAcluGreenhouseFileField(form, fileIn).ok) {
        var fidf = fieldIdFor(fileIn);
        if (fidf) {
          setFieldHelperError(fidf, "", false, fileIn);
          fileIn.setAttribute("aria-invalid", "false");
        }
      }
    }

    function clearIfValid(input) {
      if (!input || input.closest(".select-shell[data-aclu-rs-hydrated]")) return;
      var tag = input.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;
      clearPairedFileUploadIfValid(input);
      var ok;
      if (isGreenhouseEmailField(input)) ok = isGreenhouseEmailValueOk(input);
      else if (isAcluGreenhouseFileField(input)) {
        var fm = input.form;
        ok = fm ? validateAcluGreenhouseFileField(fm, input).ok : true;
      } else ok = typeof input.checkValidity === "function" && input.checkValidity();
      if (ok) {
        var fid = fieldIdFor(input);
        if (fid) {
          setFieldHelperError(fid, "", false, input);
          input.setAttribute("aria-invalid", "false");
        }
      }
    }

    form.addEventListener(
      "input",
      function (ev) {
        clearIfValid(ev.target);
      },
      true
    );
    form.addEventListener(
      "change",
      function (ev) {
        clearIfValid(ev.target);
      },
      true
    );
  }

  /**
   * @param {HTMLElement} shell
   * @param {{ id: string, name: string, required: boolean, placeholder?: string, values: { value: unknown, label: string }[] }} field
   */
  function mountCombobox(shell, field) {
    var all = (field.values || []).map(function (v) {
      return {
        value: v.value != null ? v.value : v.label,
        label: String(v.label != null ? v.label : ""),
      };
    });
    var filtered = all.slice();
    var open = false;
    var hi = -1;
    var selected = null;
    /** Чтобы после закрытия по клику на стрелку/паддинг не сработал openMenu() на том же focus. */
    var suppressOpenOnFocus = false;

    var id = field.name;
    var labelEl = shell.closest(".select__container") && shell.closest(".select__container").querySelector("label");
    var labelId = (labelEl && labelEl.id) || id + "-label";
    var placeholderText = field.placeholder != null ? field.placeholder : t("select.placeholder");

    shell.textContent = "";
    shell.setAttribute("data-aclu-rs-hydrated", "true");

    var live1 = document.createElement("span");
    live1.className = "remix-css-7pg0cj-a11yText";
    live1.setAttribute("aria-live", "polite");
    var live2 = document.createElement("span");
    live2.setAttribute("aria-live", "polite");
    live2.setAttribute("aria-atomic", "false");
    live2.setAttribute("aria-relevant", "additions text");
    live2.setAttribute("role", "log");
    live2.className = "remix-css-7pg0cj-a11yText";

    var wrapOuter = document.createElement("div");
    var control = document.createElement("div");
    control.className = "select__control";
    control.setAttribute("role", "group");

    var valueContainer = document.createElement("div");
    valueContainer.className = "select__value-container";

    var single = document.createElement("div");
    single.className = "select__single-value";
    single.setAttribute("hidden", "");
    single.id = id + "-single";

    var placeholder = document.createElement("div");
    placeholder.className = "select__placeholder";
    placeholder.id = id + "-placeholder";
    placeholder.textContent = placeholderText;

    var inputContainer = document.createElement("div");
    inputContainer.className = "select__input-container";
    inputContainer.setAttribute("data-value", "");

    var input = document.createElement("input");
    input.className = "select__input";
    input.id = id;
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.tabIndex = 0;
    input.setAttribute(
      "style",
      "label:input;color:inherit;background:0;opacity:1;width:100%;grid-area:1 / 2;font:inherit;min-width:2px;border:0;margin:0;outline:0;padding:0"
    );
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-labelledby", labelId);
    input.setAttribute("aria-controls", id + "-listbox");
    input.setAttribute("aria-invalid", "false");
    input.setAttribute("role", "combobox");
    input.setAttribute("enterKeyHint", "done");
    if (field.required) input.setAttribute("aria-required", "true");

    inputContainer.appendChild(input);

    valueContainer.appendChild(single);
    valueContainer.appendChild(placeholder);
    valueContainer.appendChild(inputContainer);

    var indicators = document.createElement("div");
    indicators.className = "select__indicators";
    var dropBtn = dropdownButton();
    indicators.appendChild(dropBtn);

    control.appendChild(valueContainer);
    control.appendChild(indicators);

    var innerWrap = document.createElement("div");
    innerWrap.appendChild(control);
    wrapOuter.appendChild(innerWrap);

    var menu = document.createElement("div");
    menu.className = "select__menu aclu-rs-menu";
    menu.setAttribute("role", "presentation");
    menu.hidden = true;

    var menuList = document.createElement("div");
    menuList.className = "select__menu-list";
    menuList.id = id + "-listbox";
    menuList.setAttribute("role", "listbox");
    menu.appendChild(menuList);

    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = field.name;
    hidden.id = id + "-value";
    hidden.value = "";
    if (field.required) hidden.setAttribute("data-aclu-required", "1");

    shell.appendChild(live1);
    shell.appendChild(live2);
    shell.appendChild(wrapOuter);
    shell.appendChild(menu);
    shell.appendChild(hidden);

    function renderOptions() {
      menuList.textContent = "";
      filtered.forEach(function (opt, i) {
        var row = document.createElement("div");
        row.className = "select__option";
        row.id = id + "-opt-" + i;
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", selected && String(selected.value) === String(opt.value) ? "true" : "false");
        row.dataset.value = String(opt.value);
        row.textContent = opt.label;
        row.addEventListener("mouseenter", function () {
          setHi(i);
        });
        row.addEventListener("mousedown", function (e) {
          e.preventDefault();
          pick(filtered[i]);
        });
        menuList.appendChild(row);
      });
      paintHi();
    }

    function setHi(i) {
      hi = i;
      paintHi();
    }

    function paintHi() {
      var children = menuList.querySelectorAll(".select__option");
      for (var j = 0; j < children.length; j++) {
        children[j].classList.toggle("select__option--is-focused", j === hi);
        if (j === hi) input.setAttribute("aria-activedescendant", children[j].id);
      }
      if (hi < 0) input.removeAttribute("aria-activedescendant");
    }

    function filterList(q) {
      var needle = (q || "").trim().toLowerCase();
      if (!needle) {
        filtered = all.slice();
      } else {
        filtered = all.filter(function (o) {
          return o.label.toLowerCase().indexOf(needle) !== -1;
        });
      }
      hi = filtered.length ? 0 : -1;
      renderOptions();
    }

    function openMenu() {
      if (open) return;
      open = true;
      menu.hidden = false;
      input.setAttribute("aria-expanded", "true");
      control.classList.add("select__control--is-focused");
      filterList(input.value);
      paintHi();
    }

    function closeMenu() {
      if (!open) return;
      open = false;
      menu.hidden = true;
      input.setAttribute("aria-expanded", "false");
      hi = -1;
      paintHi();
    }

    function pick(opt) {
      selected = opt;
      hidden.value = String(opt.value);
      inputContainer.setAttribute("data-value", hidden.value);
      single.textContent = opt.label;
      single.removeAttribute("hidden");
      placeholder.setAttribute("hidden", "");
      input.value = "";
      closeMenu();
      clearComboboxVisualError(shell);
      input.setCustomValidity("");
      var phPick = shell.querySelector(".select__placeholder");
      if (phPick) comboboxAriaDescribedby(input, phPick, id, false);
    }

    function toggleMenu() {
      if (open) closeMenu();
      else openMenu();
    }

    function onDocMouseDown(e) {
      if (!shell.contains(e.target)) closeMenu();
    }

    input.addEventListener("focus", function () {
      control.classList.add("select__control--is-focused");
      if (suppressOpenOnFocus) {
        suppressOpenOnFocus = false;
        return;
      }
      openMenu();
    });
    input.addEventListener("blur", function () {
      setTimeout(function () {
        if (!shell.contains(document.activeElement)) {
          control.classList.remove("select__control--is-focused");
          closeMenu();
        }
      }, 0);
    });
    input.addEventListener("input", function () {
      if (!open) openMenu();
      else filterList(input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === "Tab") {
        closeMenu();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) openMenu();
        else if (filtered.length) {
          hi = (hi + 1) % filtered.length;
          paintHi();
          scrollIntoView();
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) openMenu();
        else if (filtered.length) {
          hi = (hi - 1 + filtered.length) % filtered.length;
          paintHi();
          scrollIntoView();
        }
        return;
      }
      if (e.key === "Enter") {
        if (open && hi >= 0 && filtered[hi]) {
          e.preventDefault();
          pick(filtered[hi]);
        }
        return;
      }
    });

    function scrollIntoView() {
      var el = document.getElementById(id + "-opt-" + hi);
      if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
    }

    dropBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      if (open) suppressOpenOnFocus = true;
      toggleMenu();
      input.focus();
    });

    control.addEventListener("mousedown", function (e) {
      if (e.target === dropBtn || dropBtn.contains(e.target)) return;
      if (e.target === input || inputContainer.contains(e.target)) return;
      e.preventDefault();
      if (open) suppressOpenOnFocus = true;
      toggleMenu();
      input.focus();
    });

    document.addEventListener("mousedown", onDocMouseDown, true);

    ensureFieldErrorEl(id, shell);
    comboboxAriaDescribedby(input, placeholder, id, false);
    renderOptions();
    clearComboboxVisualError(shell);
  }

  function findShellByInputId(inputId) {
    var inp = document.getElementById(inputId);
    if (!inp || !inp.classList.contains("select__input")) return null;
    return inp.closest(".select-shell");
  }

  function collectFields(data) {
    var out = [];
    (data.questions || []).forEach(function (q) {
      var f = q.fields && q.fields[0];
      if (f && f.type === "multi_value_single_select" && f.values && f.values.length) {
        out.push({
          name: f.name,
          required: !!q.required,
          values: f.values,
          placeholder: t("select.placeholder"),
        });
      }
    });
    (data.eeoc_sections || []).forEach(function (sec) {
      (sec.questions || []).forEach(function (eq) {
        var f = eq.fields && eq.fields[0];
        if (f && f.type === "multi_value_single_select" && f.values && f.values.length) {
          out.push({
            name: f.name,
            required: !!eq.required,
            values: f.values,
            placeholder: t("select.placeholder"),
          });
        }
      });
    });
    return out;
  }

  function run() {
    if (window.location.protocol === "file:") {
      console.warn(
        "[aclu-hydrate-selects] Откройте через локальный сервер (npm run dev): иначе fetch к JSON может быть заблокирован."
      );
    }
    Promise.all([
      fetch("./aclu-form-fields.json").then(function (r) {
        if (!r.ok) throw new Error("aclu-form-fields.json " + r.status);
        return r.json();
      }),
      fetch("./countries.json").then(function (r) {
        if (!r.ok) throw new Error("countries.json " + r.status);
        return r.json();
      }),
      fetch("./aclu-job-post-en.json")
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .catch(function () {
          return null;
        }),
    ])
      .then(function (ref) {
        var formData = ref[0];
        var countries = ref[1];
        LOCALE = ref[2];

        var countryShell = findShellByInputId("country");
        if (countryShell) {
          var pairs = Object.keys(countries)
            .map(function (k) {
              return { value: k, label: countries[k] };
            })
            .sort(function (a, b) {
              return a.label.localeCompare(b.label, "en");
            });
          mountCombobox(countryShell, {
            name: "country",
            required: true,
            values: pairs,
            placeholder: t("select.placeholder"),
          });
        }

        collectFields(formData).forEach(function (field) {
          var shell = findShellByInputId(field.name);
          if (shell) mountCombobox(shell, field);
        });

        var form = document.getElementById("application-form");
        if (form) {
          bindAcluFileUploadUi(form);
          syncAriaRequiredToNative(form);
          bindAcluFormValidation(form);
          bindAcluNativeFieldValidation(form);
          bindAcluApplyHeroButtons(form);
          if (window.location.hash === "#application-form") {
            requestAnimationFrame(function () {
              scrollLikeGreenhouse(form);
              var fn0 = form.querySelector("#first_name");
              if (fn0 && typeof fn0.focus === "function") fn0.focus({ preventScroll: true });
            });
          }
        }

        console.log("[aclu-hydrate-selects] react-select-style combobox готово");
      })
      .catch(function (e) {
        console.error("[aclu-hydrate-selects]", e);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
