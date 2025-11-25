import { Request, Response } from "express";
import * as policyService from "../services/policy.service";

export async function createPolicy(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const result = await policyService.createPolicy(req.body, Number(user.id));
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getPolicies(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const policies = await policyService.getPolicies(Number(user.id));
    return res.json(policies);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getPolicy(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const policy = await policyService.getPolicy(
      Number(req.params.id),
      Number(user.id)
    );
    return res.json(policy);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}
