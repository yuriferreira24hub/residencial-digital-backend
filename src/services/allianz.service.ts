export class AllianzService {
  private mock = true; 

  async getDomain(code: number) {
    if (this.mock) {
      return this.mockDomain(code);
    }

    
    return [];
  }

  
  private mockDomain(code: number) {
    const domains: Record<number, any[]> = {
      81: [
        { code: 1, description: "Débito em conta bancária" },
        { code: 2, description: "Boleto Bancário" },
        { code: 4, description: "Cartão de Crédito" },
      ],
      9999: [
        { code: 1, description: "Incêndio / Raio / Explosão" },
        { code: 2, description: "Danos Elétricos" },
        { code: 3, description: "Responsabilidade Civil Familiar" },
      ],
    };

    return domains[code] || [];
  }
}
