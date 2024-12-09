import { HttpInterceptorFn } from "@angular/common/http";

// Define the Auth Interceptor function
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMDQ4NzM3NDA3LCJpYXQiOjE3MzMzNzc0MDcsImp0aSI6ImFiM2NlZDZlNTI4MzRlMTdhMjcyOGIzZjY2ZDU4ZjJlIiwidXNlcl9pZCI6MX0.SbZhv67nD5T68FvsercJOrWPje98fppXK22AozfKitc`,
      "X-CSRFTOKEN":
        "Y6uma0fzv9FVcOcOkM8yOFDKbZQdj4quWcghlG1ndIDLM7PT0miUtKfCACKMKKWa",
    },
  });

  return next(clonedRequest);
};
// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req);
// };
