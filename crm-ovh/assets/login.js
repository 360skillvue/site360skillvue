// QR code de mise en place de la double authentification (page de connexion).
(function () {
  var el = document.getElementById("totpQr"); if (!el || typeof qrcode !== "function") return;
  var q = qrcode(0, "M"); q.addData(el.getAttribute("data-uri")); q.make();
  var n = q.getModuleCount(), p = "";
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) p += "M" + c + " " + r + "h1v1h-1z";
  el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" style="width:100%;height:auto;display:block"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + p + '" fill="#000"/></svg>';
})();
