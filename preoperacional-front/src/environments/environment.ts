export const environment = {
  production: false,
  /**
   * URL base de la API. En desarrollo `ng serve` reenvía /preoperacional/api a Tomcat
   * (http://localhost:8080) gracias a proxy.conf.json, así no hay problemas de CORS ni de cookies.
   */
  apiUrl: '/preoperacional/api'
};
