import Swal from "sweetalert2"

/**
 * Show a confirmation dialog for delete actions
 * @param itemName - Name of the item being deleted (e.g., "venda", "cliente")
 * @returns Promise<boolean> - true if confirmed, false otherwise
 */
export async function confirmDelete(itemName: string): Promise<boolean> {
  const result = await Swal.fire({
    title: `Eliminar ${itemName}?`,
    text: `Tem a certeza que quer eliminar ${itemName === "a" ? "esta" : "este"} ${itemName}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#c41e3a",
    cancelButtonColor: "#666666",
    confirmButtonText: "Sim, eliminar",
    cancelButtonText: "Cancelar"
  })
  return result.isConfirmed
}

/**
 * Show a confirmation dialog for toggle actions
 * @param action - Description of the action (e.g., "marcar como pago")
 * @returns Promise<boolean> - true if confirmed, false otherwise
 */
export async function confirmAction(action: string): Promise<boolean> {
  const result = await Swal.fire({
    title: "Confirmar ação?",
    text: `Tem a certeza que quer ${action}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#b8860b",
    cancelButtonColor: "#666666",
    confirmButtonText: "Sim, confirmar",
    cancelButtonText: "Cancelar"
  })
  return result.isConfirmed
}

/**
 * Show a success notification
 */
export function showSuccess(title: string, text?: string): void {
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#b8860b",
    timer: 2000
  })
}

/**
 * Show an error notification
 */
export function showError(title: string, text?: string): void {
  Swal.fire({
    icon: "error",
    title,
    text: text || "Ocorreu um erro inesperado",
    confirmButtonColor: "#b8860b"
  })
}
