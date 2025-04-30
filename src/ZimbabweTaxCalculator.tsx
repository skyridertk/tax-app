import React, { useState } from 'react';

// Define types/interfaces
type TaxPeriod = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'annual';
type Currency = 'USD' | 'ZWG';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

interface BenefitOrDeduction {
  id: string;
  name: string;
  amount: string;
  type: 'benefit' | 'deduction';
  taxable: boolean; // For benefits: is it taxable? For deductions: is it tax-deductible?
}

type TaxBrackets = {
  [key in TaxPeriod]: TaxBracket[];
};

interface TaxResult {
  grossIncome: number;
  taxableBenefits: number;
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  aidsLevy: number;
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number;
}

const ZimbabweTaxCalculator: React.FC = () => {
  const [income, setIncome] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [period, setPeriod] = useState<TaxPeriod>('monthly');
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [benefitsAndDeductions, setBenefitsAndDeductions] = useState<BenefitOrDeduction[]>([]);
  const [newItem, setNewItem] = useState<BenefitOrDeduction>({
    id: '',
    name: '',
    amount: '',
    type: 'benefit',
    taxable: true
  });

  // Tax brackets data for USD
  const usdTaxBrackets: TaxBrackets = {
    daily: [
      { min: 0, max: 3.29, rate: 0, deduction: 0 },
      { min: 3.3, max: 9.86, rate: 0.2, deduction: 0.66 },
      { min: 9.87, max: 32.88, rate: 0.25, deduction: 1.15 },
      { min: 32.89, max: 65.75, rate: 0.3, deduction: 2.79 },
      { min: 65.76, max: 98.63, rate: 0.35, deduction: 6.08 },
      { min: 98.64, max: Infinity, rate: 0.4, deduction: 11.01 }
    ],
    weekly: [
      { min: 0, max: 23.08, rate: 0, deduction: 0 },
      { min: 23.09, max: 69.23, rate: 0.2, deduction: 4.62 },
      { min: 69.24, max: 230.77, rate: 0.25, deduction: 8.08 },
      { min: 230.78, max: 461.54, rate: 0.3, deduction: 19.62 },
      { min: 461.55, max: 692.31, rate: 0.35, deduction: 42.69 },
      { min: 692.32, max: Infinity, rate: 0.4, deduction: 77.31 }
    ],
    fortnightly: [
      { min: 0, max: 46.15, rate: 0, deduction: 0 },
      { min: 46.16, max: 138.46, rate: 0.2, deduction: 9.23 },
      { min: 138.47, max: 461.54, rate: 0.25, deduction: 16.15 },
      { min: 461.55, max: 923.08, rate: 0.3, deduction: 39.23 },
      { min: 923.09, max: 1384.62, rate: 0.35, deduction: 85.38 },
      { min: 1384.63, max: Infinity, rate: 0.4, deduction: 154.62 }
    ],
    monthly: [
      { min: 0, max: 100, rate: 0, deduction: 0 },
      { min: 100.01, max: 300, rate: 0.2, deduction: 20 },
      { min: 300.01, max: 1000, rate: 0.25, deduction: 35 },
      { min: 1000.01, max: 2000, rate: 0.3, deduction: 85 },
      { min: 2000.01, max: 3000, rate: 0.35, deduction: 185 },
      { min: 3000.01, max: Infinity, rate: 0.4, deduction: 335 }
    ],
    annual: [
      { min: 0, max: 1200, rate: 0, deduction: 0 },
      { min: 1201, max: 3600, rate: 0.2, deduction: 240 },
      { min: 3601, max: 12000, rate: 0.25, deduction: 420 },
      { min: 12001, max: 24000, rate: 0.3, deduction: 1020 },
      { min: 24001, max: 36000, rate: 0.35, deduction: 2220 },
      { min: 36001, max: Infinity, rate: 0.4, deduction: 4020 }
    ]
  };

  // Tax brackets data for ZWG
  const zwgTaxBrackets: TaxBrackets = {
    daily: [
      { min: 0, max: 92.05, rate: 0, deduction: 0 },
      { min: 92.06, max: 276.16, rate: 0.2, deduction: 18.41 },
      { min: 276.17, max: 920.55, rate: 0.25, deduction: 32.22 },
      { min: 920.56, max: 1841.1, rate: 0.3, deduction: 78.25 },
      { min: 1841.11, max: 2761.64, rate: 0.35, deduction: 170.3 },
      { min: 2761.65, max: Infinity, rate: 0.4, deduction: 308.38 }
    ],
    weekly: [
      { min: 0, max: 646.15, rate: 0, deduction: 0 },
      { min: 646.17, max: 1938.46, rate: 0.2, deduction: 129.23 },
      { min: 1938.48, max: 6461.54, rate: 0.25, deduction: 226.15 },
      { min: 6461.56, max: 12923.08, rate: 0.3, deduction: 549.23 },
      { min: 12923.1, max: 19384.62, rate: 0.35, deduction: 1195.38 },
      { min: 19384.63, max: Infinity, rate: 0.4, deduction: 2164.62 }
    ],
    fortnightly: [
      { min: 0, max: 1292.31, rate: 0, deduction: 0 },
      { min: 1292.35, max: 3876.92, rate: 0.2, deduction: 258.46 },
      { min: 3876.96, max: 12923.08, rate: 0.25, deduction: 452.31 },
      { min: 12923.12, max: 25846.15, rate: 0.3, deduction: 1098.46 },
      { min: 25846.19, max: 38769.23, rate: 0.35, deduction: 2390.77 },
      { min: 38769.27, max: Infinity, rate: 0.4, deduction: 4329.23 }
    ],
    monthly: [
      { min: 0, max: 2800, rate: 0, deduction: 0 },
      { min: 2800.01, max: 8400, rate: 0.2, deduction: 560 },
      { min: 8400.01, max: 28000, rate: 0.25, deduction: 980 },
      { min: 28000.01, max: 56000, rate: 0.3, deduction: 2380 },
      { min: 56000.01, max: 84000, rate: 0.35, deduction: 5180 },
      { min: 84000.01, max: Infinity, rate: 0.4, deduction: 9380 }
    ],
    annual: [
      { min: 0, max: 33600, rate: 0, deduction: 0 },
      { min: 33601, max: 100800, rate: 0.2, deduction: 6720 },
      { min: 100801, max: 336000, rate: 0.25, deduction: 11760 },
      { min: 336001, max: 672000, rate: 0.3, deduction: 28560 },
      { min: 672001, max: 1008000, rate: 0.35, deduction: 62160 },
      { min: 1008001, max: Infinity, rate: 0.4, deduction: 112560 }
    ]
  };

  // Common Zimbabwe tax deductions and benefits
  const commonItems = [
    { name: "Housing Allowance", type: "benefit", taxable: true },
    { name: "Transport Allowance", type: "benefit", taxable: true },
    { name: "Medical Aid Contributions", type: "deduction", taxable: true },
    { name: "Pension Contributions", type: "deduction", taxable: true },
    { name: "Fuel Allowance", type: "benefit", taxable: true },
    { name: "NSSA Contributions", type: "deduction", taxable: true },
    { name: "Professional Subscriptions", type: "deduction", taxable: true },
    { name: "Car Benefit", type: "benefit", taxable: true },
    { name: "Education Allowance", type: "benefit", taxable: false },
    { name: "Meal Allowance", type: "benefit", taxable: true }
  ];

  const handleAddItem = () => {
    if (!newItem.name || !newItem.amount || isNaN(parseFloat(newItem.amount)) || parseFloat(newItem.amount) <= 0) {
      alert('Please enter a valid name and amount');
      return;
    }

    const item: BenefitOrDeduction = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setBenefitsAndDeductions([...benefitsAndDeductions, item]);
    setNewItem({
      id: '',
      name: '',
      amount: '',
      type: 'benefit',
      taxable: true
    });
  };

  const handleRemoveItem = (id: string) => {
    setBenefitsAndDeductions(benefitsAndDeductions.filter(item => item.id !== id));
  };

  const handleSelectCommonItem = (selectedItem: { name: string, type: string, taxable: boolean }) => {
    setNewItem({
      ...newItem,
      name: selectedItem.name,
      type: selectedItem.type as 'benefit' | 'deduction',
      taxable: selectedItem.taxable
    });
  };

  const calculateTax = (): void => {
    if (!income || isNaN(parseFloat(income)) || parseFloat(income) <= 0) {
      alert('Please enter a valid income amount');
      return;
    }

    const basicIncome = parseFloat(income);
    
    // Calculate taxable benefits
    const taxableBenefits = benefitsAndDeductions
      .filter(item => item.type === 'benefit' && item.taxable)
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Calculate non-taxable benefits
    const nonTaxableBenefits = benefitsAndDeductions
      .filter(item => item.type === 'benefit' && !item.taxable)
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Calculate tax deductions
    const taxDeductions = benefitsAndDeductions
      .filter(item => item.type === 'deduction' && item.taxable)
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Calculate non-tax deductions
    const nonTaxDeductions = benefitsAndDeductions
      .filter(item => item.type === 'deduction' && !item.taxable)
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Calculate total deductions (both tax and non-tax)
    const totalDeductions = taxDeductions + nonTaxDeductions;
    
    // Calculate taxable income
    const taxableIncome = basicIncome + taxableBenefits - taxDeductions;
    
    // Get appropriate tax brackets
    const brackets = currency === 'USD' ? usdTaxBrackets[period] : zwgTaxBrackets[period];
    
    let tax = 0;
    let bracket: TaxBracket | null = null;
    
    // Find the appropriate tax bracket
    for (const b of brackets) {
      if (taxableIncome > b.min && taxableIncome <= b.max) {
        bracket = b;
        break;
      } else if (taxableIncome > b.min && b.max === Infinity) {
        bracket = b;
        break;
      }
    }
    
    // Calculate tax using the formula: income * rate - deduction
    if (bracket) {
      tax = (taxableIncome * bracket.rate) - bracket.deduction;
      tax = Math.max(0, tax); // Ensure tax isn't negative
    }
    
    // Calculate AIDS levy (3% of tax)
    const aidsLevy = tax * 0.03;
    
    // Total payable tax
    const totalTax = tax + aidsLevy;
    
    // Net income after tax
    const totalBenefits = taxableBenefits + nonTaxableBenefits;
    const netIncome = basicIncome + totalBenefits - totalDeductions - totalTax;
    
    // Effective tax rate
    const grossTotal = basicIncome + totalBenefits;
    
    setTaxResult({
      grossIncome: basicIncome,
      taxableBenefits: taxableBenefits,
      totalDeductions: totalDeductions,
      taxableIncome: taxableIncome,
      incomeTax: tax,
      aidsLevy: aidsLevy,
      totalTax: totalTax,
      netIncome: netIncome,
      effectiveTaxRate: grossTotal === 0 ? 0 : (totalTax / grossTotal) * 100
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleReset = (): void => {
    setIncome('');
    setBenefitsAndDeductions([]);
    setTaxResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-green-700">Zimbabwe PAYE Tax Calculator (2025)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value as Currency)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="USD">Foreign Currency (USD)</option>
                <option value="ZWG">Zimbabwe Gold (ZWG)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Income Period</label>
              <select
                value={period}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value as TaxPeriod)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">{currency === 'USD' ? '$' : 'ZWG'}</span>
                </div>
                <input
                  type="number"
                  value={income}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncome(e.target.value)}
                  placeholder={`Enter ${period} salary`}
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={calculateTax}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Calculate Tax
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Benefits & Deductions</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium mb-2">Add New Item</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Common Items</label>
                  <select 
                    onChange={(e) => {
                      const selectedIndex = parseInt(e.target.value);
                      if (selectedIndex >= 0) {
                        handleSelectCommonItem(commonItems[selectedIndex]);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="-1">-- Select a common item --</option>
                    {commonItems.map((item, index) => (
                      <option key={index} value={index}>
                        {item.name} ({item.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Item Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value as 'benefit' | 'deduction'})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="benefit">Benefit</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    {newItem.type === 'benefit' ? 'Taxable Benefit?' : 'Tax Deductible?'}
                  </label>
                  <select
                    value={newItem.taxable.toString()}
                    onChange={(e) => setNewItem({...newItem, taxable: e.target.value === 'true'})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">{currency === 'USD' ? '$' : 'ZWG'}</span>
                    </div>
                    <input
                      type="number"
                      value={newItem.amount}
                      onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                      placeholder="Enter amount"
                      className="w-full p-2 pl-8 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleAddItem}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
              >
                Add Item
              </button>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Your Benefits & Deductions</h3>
              {benefitsAndDeductions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {benefitsAndDeductions.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.type === 'benefit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.type === 'benefit' ? 'Benefit' : 'Deduction'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {item.type === 'benefit' ? (
                              item.taxable ? 'Taxable' : 'Non-Taxable'
                            ) : (
                              item.taxable ? 'Tax-Deductible' : 'Non-Tax-Deductible'
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {currency === 'USD' ? '$' : 'ZWG'} {parseFloat(item.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-md text-gray-500 text-center">
                  No benefits or deductions added yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Tax Calculation Results</h2>
        {taxResult ? (
          <div className="bg-gray-100 p-6 rounded-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-3 border-b border-gray-300 pb-2">Income Breakdown</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm font-medium">Basic Salary:</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(taxResult.grossIncome)}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm font-medium">Taxable Benefits:</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(taxResult.taxableBenefits)}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm font-medium">Total Deductions:</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(taxResult.totalDeductions)}</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-2 text-sm font-medium">Taxable Income:</td>
                      <td className="py-2 text-sm text-right font-medium">{formatCurrency(taxResult.taxableIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-3 border-b border-gray-300 pb-2">Tax Summary</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm font-medium">Income Tax:</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(taxResult.incomeTax)}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-sm font-medium">AIDS Levy (3%):</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(taxResult.aidsLevy)}</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-2 text-sm font-bold">Total Tax:</td>
                      <td className="py-2 text-sm text-right font-bold">{formatCurrency(taxResult.totalTax)}</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-green-50">
                      <td className="py-2 text-sm font-bold text-green-700">Net Income:</td>
                      <td className="py-2 text-sm text-right font-bold text-green-700">{formatCurrency(taxResult.netIncome)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-sm font-medium">Effective Tax Rate:</td>
                      <td className="py-2 text-sm text-right">{taxResult.effectiveTaxRate.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-md flex items-center justify-center h-48 text-gray-500">
            Enter your income details and calculate to see results
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h3 className="text-md font-semibold mb-2">Notes:</h3>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>Tax calculations are based on the Zimbabwe Revenue Authority PAYE Tax Tables for 2025.</li>
          <li>Taxable benefits are added to your basic salary to determine your taxable income.</li>
          <li>Tax-deductible items reduce your taxable income before tax is calculated.</li>
          <li>AIDS Levy is calculated at 3% of the income tax payable.</li>
          <li>This calculator provides estimates only and should not be used for official tax filing purposes.</li>
          <li>Always consult with a tax professional or ZIMRA for official tax guidance.</li>
        </ul>
      </div>
    </div>
  );
};

export default ZimbabweTaxCalculator;