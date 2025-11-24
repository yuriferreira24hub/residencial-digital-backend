import { Request, Response } from "express";
import { userService } from "../services/user.service";


export async function createUser(req: Request, res: Response) {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  const users = await userService.getUsers();
  return res.json(users);
}

export async function getUser(req: Request, res: Response) {
  try {
    const user = await userService.getUserById(Number(req.params.id));
    return res.json(user);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const user = await userService.updateUser(
      Number(req.params.id),
      req.body
    );
    return res.json(user);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await userService.deleteUser(Number(req.params.id));
    return res.json({ message: "Usuário removido com sucesso" });
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}
