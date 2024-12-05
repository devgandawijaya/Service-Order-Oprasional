const helmet = require("helmet");

module.exports = function (app) {
  // Mengaktifkan helmet dengan berbagai opsi yang disarankan
  app.use(
    helmet({
      // Mengatur Content Security Policy (CSP)
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],  // Hanya izinkan resource dari domain yang sama
          styleSrc: ["'self'", "'unsafe-inline'", "https://trusted-css-source.com"], // Gunakan 'unsafe-inline' jika perlu
          scriptSrc: ["'self'", "https://trusted-scripts.com"],  // Izinkan script dari sumber terpercaya
          objectSrc: ["'none'"],  // Blokir <object>, <embed>, dan <applet>
          upgradeInsecureRequests: [],  // Otomatis upgrade HTTP ke HTTPS
        },
      },

      // Mengaktifkan Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000,  // Maksimum usia untuk force HTTPS adalah satu tahun
        includeSubDomains: true,  // Berlaku untuk sub-domain
        preload: true,  // Untuk preload list HSTS browser
      },

      // Mengatur X-Frame-Options untuk mencegah Clickjacking
      frameguard: {
        action: "deny",  // Mencegah agar situs Anda tidak bisa dimasukkan dalam frame atau iframe
      },

      // Mengaktifkan X-XSS-Protection untuk mencegah XSS di browser lama
      xssFilter: true,

      // Mengaktifkan X-Content-Type-Options untuk mencegah MIME-type sniffing
      noSniff: true,
      
      // Menonaktifkan informasi X-Powered-By untuk menyembunyikan jenis server
      hidePoweredBy: true,
    })
  );
};