import { Request, Response } from "express";
import * as propertyService from "../services/property.service";

export async function create(req: Request, res: Response) {
  const user = (req as any).user;
  const result = await propertyService.createProperty(req.body, Number(user.sub));
  return res.status(201).json(result);
}

export async function list(req: Request, res: Response) {
  const user = (req as any).user;
  const properties = await propertyService.listProperties(Number(user.sub));
  return res.json(properties);
}

export async function get(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const property = await propertyService.getProperty(
      Number(req.params.id),
      Number(user.sub)
    );
    return res.json(property);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}

export async function update(req: Request, res: Response) {
  const user = (req as any).user;
  const property = await propertyService.updateProperty(
    Number(req.params.id),
    req.body,
    Number(user.sub)
  );
  return res.json(property);
}

export async function remove(req: Request, res: Response) {
  const user = (req as any).user;
  await propertyService.deleteProperty(
    Number(req.params.id),
    Number(user.sub)
  );
  return res.json({ message: "Imóvel removido com sucesso" });
}

export async function getWithQuotes(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;

    const property = await propertyService.getPropertyWithQuotes(id, Number(user.sub));

    return res.json(property);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}
