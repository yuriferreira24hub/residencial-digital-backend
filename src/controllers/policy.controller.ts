import { Request, Response } from "express";
import * as policyService from "../services/policy.service";

export async function createPolicy(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await policyService.createPolicy(req.body, Number(user.sub));
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getPolicies(req: Request, res: Response) {
  const user = (req as any).user;
  const policies = await policyService.getPolicies(Number(user.sub));
  return res.json(policies);
}

export async function getPolicy(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const policy = await policyService.getPolicy(
      Number(req.params.id),
      Number(user.sub)
    );
    return res.json(policy);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}
