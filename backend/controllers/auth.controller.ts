import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { AuthService } from '../services/auth.service.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  ApiResponse.success(res, result);
});

export const crearPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, nueva_password } = req.body;
  await AuthService.crearPassword(email, nueva_password);
  ApiResponse.success(res, null, 'Contrasena creada exitosamente');
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, tipo_contrato, tipo_area } = req.body;
  const result = await AuthService.register(email, password, tipo_contrato, tipo_area);
  ApiResponse.created(res, result, 'Cuenta activada exitosamente');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { contrasena_actual, nueva_contrasena } = req.body;
  await AuthService.changePassword(req.user.id, contrasena_actual, nueva_contrasena);
  ApiResponse.success(res, null, 'Contrasena actualizada exitosamente');
});

export const getOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await AuthService.getOwnProfile(req.user.id);
  ApiResponse.success(res, profile);
});

export const updateOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, email } = req.body;
  await AuthService.updateOwnProfile(req.user.id, nombre, email);
  ApiResponse.success(res, null, 'Perfil actualizado exitosamente');
});

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await AuthService.getAllUsers();
  ApiResponse.success(res, users);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, email, rol_ids, tipo_contrato, tipo_area } = req.body;
  await AuthService.updateUser(
    Number(id),
    req.user.id,
    req.user.roles_globales,
    nombre,
    email,
    rol_ids,
    tipo_contrato,
    tipo_area,
  );
  ApiResponse.success(res, null, 'Usuario actualizado exitosamente');
});

export const toggleUserEstado = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AuthService.toggleUserEstado(Number(id));
  const message = result.activo ? 'Usuario activado' : 'Usuario desactivado';
  ApiResponse.success(res, result, message);
});
