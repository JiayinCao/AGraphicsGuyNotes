(function () {
  var handled = false;

  function isEditable(el) {
    if (!el || !el.tagName) {
      return false;
    }
    var tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    );
  }

  function isHomeKey(e) {
    return e.key === "Home" || e.code === "Home" || e.keyCode === 36;
  }

  function isPageTopShortcut(e) {
    if (!isHomeKey(e)) {
      return false;
    }
    if (e.altKey) {
      return false;
    }
    if (e.ctrlKey || e.metaKey) {
      return !e.shiftKey;
    }
    return !e.shiftKey;
  }

  function getPostStartEl() {
    return (
      document.getElementById("post-start") ||
      document.querySelector("section.container.post article h1.title") ||
      document.querySelector("section.container.post article")
    );
  }

  function scrollToPostStart() {
    var target = getPostStartEl();
    if (!target) {
      window.scrollTo(0, 0);
      return;
    }

    if (document.activeElement && document.activeElement.closest) {
      var trapped = document.activeElement.closest(".navigation, .toc");
      if (trapped) {
        document.activeElement.blur();
      }
    }

    target.scrollIntoView({ block: "start", behavior: "auto" });

    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (!isPageTopShortcut(e)) {
      return;
    }
    if (isEditable(e.target)) {
      return;
    }

    handled = true;
    e.preventDefault();
    e.stopImmediatePropagation();
    scrollToPostStart();
  }

  function onKeyUp(e) {
    if (!isPageTopShortcut(e)) {
      return;
    }
    if (isEditable(e.target)) {
      return;
    }
    if (handled) {
      handled = false;
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
    scrollToPostStart();
  }

  function bind() {
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKeyUp, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
