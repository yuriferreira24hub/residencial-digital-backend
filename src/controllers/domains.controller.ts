import { Request, Response } from "express";
import { AllianzService } from "../services/allianz.service";

export class DomainsController {
  private allianzService: AllianzService;

  constructor() {
    this.allianzService = new AllianzService();
  }

  /**
   * GET /domains/:code
   * Consulta domínios da Allianz (ex: 9999 = coberturas)
   */
  public getDomain = async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          message: "O código do domínio é obrigatório.",
        });
      }

      const domainCode = Number(code);

      if (isNaN(domainCode)) {
        return res.status(400).json({
          message: "O código do domínio deve ser numérico.",
        });
      }

      // Chama o serviço da Allianz
      const result = await this.allianzService.getDomain(domainCode);

      return res.status(200).json({
        message: "Domínios obtidos com sucesso.",
        data: result,
      });

    } catch (error: any) {
      console.error("Erro ao consultar domínios:", error);

      return res.status(500).json({
        message: "Erro interno ao consultar domínios.",
        details: error?.message || error,
      });
    }
  };
}
