import { Request, Response } from "express";
import * as propertyService from "../services/property.service";

export async function create(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const result = await propertyService.createProperty(req.body, Number(user.id));
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const properties = await propertyService.listProperties(Number(user.id));
    return res.json(properties);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function get(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const property = await propertyService.getProperty(
      Number(req.params.id),
      Number(user.id)
    );
    return res.json(property);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const property = await propertyService.updateProperty(
      Number(req.params.id),
      req.body,
      Number(user.id)
    );
    return res.json(property);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    await propertyService.deleteProperty(
      Number(req.params.id),
      Number(user.id)
    );
    return res.json({ message: "Imóvel removido com sucesso" });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getWithQuotes(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const id = Number(req.params.id);
    const property = await propertyService.getPropertyWithQuotes(id, Number(user.id));
    return res.json(property);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}
