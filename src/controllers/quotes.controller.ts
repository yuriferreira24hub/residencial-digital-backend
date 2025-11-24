import { Request, Response } from "express";
import * as quoteService from "../services/quote.service";

export async function createQuote(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await quoteService.createQuote(req.body, Number(user.sub));
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getQuotes(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const quotes = await quoteService.getQuotes(Number(user.sub));
    return res.json(quotes);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getQuote(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const quote = await quoteService.getQuote(
      Number(req.params.id),
      Number(user.sub)
    );
    return res.json(quote);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}

export async function approveQuote(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await quoteService.approveQuote(
      Number(req.params.id),
      user
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function rejectQuote(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { reason } = req.body;

    const result = await quoteService.rejectQuote(
      Number(req.params.id),
      user,
      reason
    );

    return res.json(result);

  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}


export async function getPendingQuotes(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const quotes = await quoteService.getPendingQuotes(user);

    return res.json(quotes);

  } catch (err: any) {
    return res.status(403).json({ message: err.message });
  }
}
