import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

/**
 * Standard API error response type
 */
export interface ApiError {
  error: string
  code?: string
  details?: string
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, code }, { status })
}

/**
 * Handle Prisma errors with user-friendly messages
 */
export function handlePrismaError(error: unknown): NextResponse<ApiError> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.join(", ") || "campo"
        return errorResponse(`Já existe um registo com este ${field}`, 409, "DUPLICATE")
      
      case "P2003":
        // Foreign key constraint violation
        return errorResponse("Este registo está associado a outros dados e não pode ser modificado", 400, "FK_CONSTRAINT")
      
      case "P2025":
        // Record not found
        return errorResponse("Registo não encontrado", 404, "NOT_FOUND")
      
      case "P2014":
        // Required relation violation
        return errorResponse("Faltam dados obrigatórios relacionados", 400, "MISSING_RELATION")
      
      default:
        console.error("Prisma error:", error.code, error.message)
        return errorResponse("Erro de base de dados", 500, error.code)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse("Dados inválidos fornecidos", 400, "VALIDATION")
  }
  
  if (error instanceof Error) {
    console.error("Unexpected error:", error.message)
    return errorResponse("Erro interno do servidor", 500)
  }
  
  console.error("Unknown error:", error)
  return errorResponse("Erro desconhecido", 500)
}

/**
 * Common validation errors
 */
export const ValidationErrors = {
  required: (field: string) => errorResponse(`${field} é obrigatório`, 400, "REQUIRED"),
  invalid: (field: string) => errorResponse(`${field} é inválido`, 400, "INVALID"),
  tooLong: (field: string, max: number) => errorResponse(`${field} deve ter no máximo ${max} caracteres`, 400, "TOO_LONG"),
  notFound: (item: string) => errorResponse(`${item} não encontrado`, 404, "NOT_FOUND"),
}
