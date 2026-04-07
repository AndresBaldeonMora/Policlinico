import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export const toastExito = (mensaje: string) =>
  Toast.fire({ icon: "success", title: mensaje });

export const toastError = (mensaje: string) =>
  Toast.fire({ icon: "error", title: mensaje });

export const toastInfo = (mensaje: string) =>
  Toast.fire({ icon: "info", title: mensaje });
