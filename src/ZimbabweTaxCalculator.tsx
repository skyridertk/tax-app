import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Define types/interfaces
type TaxPeriod = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'annual';
// type Currency = 'USD' | 'ZWG'; // Removed unused type
type ThemeColor = 'green' | 'blue' | 'purple' | 'indigo';



interface BenefitOrDeduction {
  id: string;
  name: string;
  amount: string;
  type: 'benefit' | 'deduction';
  taxable: boolean; // For benefits: is it taxable? For deductions: is it tax-deductible?
}

// type TaxBrackets = { // Removed unused type
//   [key in TaxPeriod]: TaxBracket[];
// };

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

const ZimbabweTaxCalculator = () => {
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ZWG'>('USD'); // Use the type directly here
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
  const [activeSection, setActiveSection] = useState<'income' | 'benefits' | 'results'>('income');
  const [theme, setTheme] = useState<ThemeColor>('green');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Theme color classes
  const themeClasses = {
    green: {
      primary: 'bg-emerald-600 hover:bg-emerald-700',
      secondary: 'bg-emerald-100 text-emerald-800',
      accent: 'text-emerald-600',
      highlight: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'ring-emerald-500',
      gradient: 'from-emerald-500 to-teal-600'
    },
    blue: {
      primary: 'bg-blue-600 hover:bg-blue-700',
      secondary: 'bg-blue-100 text-blue-800',
      accent: 'text-blue-600',
      highlight: 'bg-blue-50',
      border: 'border-blue-200',
      ring: 'ring-blue-500',
      gradient: 'from-blue-500 to-cyan-600'
    },
    purple: {
      primary: 'bg-purple-600 hover:bg-purple-700',
      secondary: 'bg-purple-100 text-purple-800',
      accent: 'text-purple-600',
      highlight: 'bg-purple-50',
      border: 'border-purple-200',
      ring: 'ring-purple-500',
      gradient: 'from-purple-500 to-pink-600'
    },
    indigo: {
      primary: 'bg-indigo-600 hover:bg-indigo-700',
      secondary: 'bg-indigo-100 text-indigo-800',
      accent: 'text-indigo-600',
      highlight: 'bg-indigo-50',
      border: 'border-indigo-200',
      ring: 'ring-indigo-500',
      gradient: 'from-indigo-500 to-violet-600'
    }
  };

  // Tax brackets data for USD
  const usdTaxBrackets = {
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
  const zwgTaxBrackets = {
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

  // Define a type for the common items structure if not already defined elsewhere
  type CommonItem = { name: string; type: 'benefit' | 'deduction'; taxable: boolean };

  // Common Zimbabwe tax deductions and benefits
  const commonItems: CommonItem[] = [
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

  // No auto-navigation effects - users control navigation manually

  const handleContinueToNextSection = () => {
    if (income && parseFloat(income) > 0) {
      setActiveSection('benefits');
    } else {
      alert('Please enter a valid income amount');
    }
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.amount || isNaN(parseFloat(newItem.amount)) || parseFloat(newItem.amount) <= 0) {
      alert('Please enter a valid name and amount');
      return;
    }

    const item = {
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
    // No auto-navigation after adding an item
  };

  const handleRemoveItem = (id: string) => {
    setBenefitsAndDeductions(benefitsAndDeductions.filter(item => item.id !== id));
  };

  const handleSelectCommonItem = (selectedItem: CommonItem) => {
    setNewItem({
      ...newItem,
      name: selectedItem.name,
      type: selectedItem.type,
      taxable: selectedItem.taxable
    });
  };

  const calculateTax = () => {
    if (!income || isNaN(parseFloat(income)) || parseFloat(income) <= 0) {
      alert('Please enter a valid income amount');
      return;
    }

    setIsCalculating(true);

    // Simulate a calculation process with delay
    setTimeout(() => {
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
      let bracket = null;

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

      setIsCalculating(false);
      // Only now navigate to results after calculation is complete
      setActiveSection('results');
    }, 800);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency, // Use the state variable which holds 'USD' or 'ZWG'
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleReset = () => {
    setIncome('');
    setBenefitsAndDeductions([]);
    setTaxResult(null);
    setActiveSection('income');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="rounded-xl shadow-lg overflow-hidden mb-8">
        <div className={`bg-gradient-to-r ${themeClasses[theme].gradient} p-6 md:p-8`}>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white font-sans">
              Zimbabwe PAYE Tax Calculator
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setTheme('green')}
                className={`w-6 h-6 rounded-full bg-emerald-500 border-2 ${theme === 'green' ? 'border-white' : 'border-transparent'}`}
                aria-label="Green theme"
              ></button>
              <button
                onClick={() => setTheme('blue')}
                className={`w-6 h-6 rounded-full bg-blue-500 border-2 ${theme === 'blue' ? 'border-white' : 'border-transparent'}`}
                aria-label="Blue theme"
              ></button>
              <button
                onClick={() => setTheme('purple')}
                className={`w-6 h-6 rounded-full bg-purple-500 border-2 ${theme === 'purple' ? 'border-white' : 'border-transparent'}`}
                aria-label="Purple theme"
              ></button>
              <button
                onClick={() => setTheme('indigo')}
                className={`w-6 h-6 rounded-full bg-indigo-500 border-2 ${theme === 'indigo' ? 'border-white' : 'border-transparent'}`}
                aria-label="Indigo theme"
              ></button>
            </div>
          </div>
          <p className="text-white text-opacity-90 mt-2 font-light tracking-wide">
            Calculate your 2025 PAYE tax with benefits and deductions in ZWG or USD
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveSection('income')}
              className={`relative px-4 py-4 text-sm font-medium transition-colors duration-200 
                ${activeSection === 'income'
                  ? `${themeClasses[theme].accent} border-b-2 border-current`
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <div className="flex items-center">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-white 
                  ${activeSection === 'income'
                    ? themeClasses[theme].primary
                    : 'bg-gray-400'}
                `}>1</span>
                Basic Income
              </div>
              {activeSection === 'income' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeClasses[theme].primary}`}
                  layoutId="underline"
                />
              )}
            </button>
            <button
              onClick={() => setActiveSection('benefits')}
              className={`relative px-4 py-4 text-sm font-medium transition-colors duration-200
                ${activeSection === 'benefits'
                  ? `${themeClasses[theme].accent} border-b-2 border-current`
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <div className="flex items-center">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-white
                  ${activeSection === 'benefits'
                    ? themeClasses[theme].primary
                    : 'bg-gray-400'}
                `}>2</span>
                Benefits & Deductions
              </div>
              {activeSection === 'benefits' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeClasses[theme].primary}`}
                  layoutId="underline"
                />
              )}
            </button>
            <button
              onClick={() => setActiveSection('results')}
              className={`relative px-4 py-4 text-sm font-medium transition-colors duration-200
                ${activeSection === 'results'
                  ? `${themeClasses[theme].accent} border-b-2 border-current`
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <div className="flex items-center">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-white
                  ${activeSection === 'results'
                    ? themeClasses[theme].primary
                    : 'bg-gray-400'}
                `}>3</span>
                Tax Results
              </div>
              {activeSection === 'results' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeClasses[theme].primary}`}
                  layoutId="underline"
                />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Income Section */}
          {activeSection === 'income' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="md:flex">
                <div className="md:w-1/3 bg-gray-50 p-6 flex flex-col justify-center">
                  <h2 className={`text-xl font-bold mb-4 ${themeClasses[theme].accent}`}>Basic Income</h2>
                  <p className="text-gray-600 mb-4">
                    Enter your basic salary and select the currency and payment period.
                  </p>
                  <div className="hidden md:block">
                    <img
                      src="https://api.dicebear.com/6.x/shapes/svg?seed=income"
                      alt="Income illustration"
                      className="max-w-[200px] mx-auto opacity-80"
                    />
                  </div>
                </div>

                <div className="md:w-2/3 p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as 'USD' | 'ZWG')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
                        >
                          <option value="USD">Foreign Currency (USD)</option>
                          <option value="ZWG">Zimbabwe Gold (ZWG)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Income Period</label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value as TaxPeriod)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="fortnightly">Fortnightly</option>
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-500 font-medium">{currency === 'USD' ? '$' : 'ZWG'}</span>
                        </div>
                        <input
                          type="number"
                          value={income}
                          onChange={(e) => setIncome(e.target.value)}
                          placeholder={`Enter your ${period} salary`}
                          className={`w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${themeClasses[theme].ring} focus:ring-opacity-50 focus:border-transparent transition-shadow`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleContinueToNextSection}
                        className={`px-6 py-2 rounded-lg text-white ${themeClasses[theme].primary} transition-colors shadow-sm hover:shadow`}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Benefits & Deductions Section */}
          {activeSection === 'benefits' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="md:flex">
                <div className="md:w-1/4 bg-gray-50 p-6 flex flex-col justify-center">
                  <h2 className={`text-xl font-bold mb-4 ${themeClasses[theme].accent}`}>Benefits & Deductions</h2>
                  <p className="text-gray-600 mb-4">
                    Add any benefits you receive and deductions from your income.
                  </p>
                  <div className="hidden md:block">
                    <img
                      src="https://api.dicebear.com/6.x/shapes/svg?seed=benefits"
                      alt="Benefits illustration"
                      className="max-w-[150px] mx-auto opacity-80"
                    />
                  </div>
                </div>

                <div className="md:w-3/4 p-6">
                  <div className="space-y-6">
                    <div className={`bg-gray-50 p-5 rounded-lg border ${themeClasses[theme].border}`}>
                      <h3 className={`text-lg font-medium mb-4 ${themeClasses[theme].accent}`}>Add New Item</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Common Items</label>
                          <select
                            onChange={(e) => {
                              const selectedIndex = parseInt(e.target.value);
                              if (selectedIndex >= 0) {
                                handleSelectCommonItem(commonItems[selectedIndex]);
                              }
                            }}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                          <input
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="Enter item name"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                          <select
                            value={newItem.type}
                            onChange={(e) => setNewItem({...newItem, type: e.target.value as 'benefit' | 'deduction'})}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
                          >
                            <option value="benefit">Benefit</option>
                            <option value="deduction">Deduction</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {newItem.type === 'benefit' ? 'Taxable Benefit?' : 'Tax Deductible?'}
                          </label>
                          <select
                            value={newItem.taxable.toString()}
                            onChange={(e) => setNewItem({ ...newItem, taxable: e.target.value === 'true' })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500">{currency === 'USD' ? '$' : 'ZWG'}</span>
                            </div>
                            <input
                              type="number"
                              value={newItem.amount}
                              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                              placeholder="Enter amount"
                              className="w-full p-2.5 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-shadow"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleAddItem}
                        className={`w-full p-2.5 rounded-lg text-white ${themeClasses[theme].primary} transition-colors`}
                      >
                        Add Item
                      </button>
                    </div>

                    <div>
                      <h3 className={`text-lg font-medium mb-3 ${themeClasses[theme].accent}`}>Your Benefits & Deductions</h3>

                      <AnimatePresence>
                        {benefitsAndDeductions.length > 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white border rounded-lg overflow-hidden"
                          >
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence>
                                  {benefitsAndDeductions.map((item) => (
                                    <motion.tr
                                      key={item.id}
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                          ${item.type === 'benefit'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'}
                                        `}>
                                          {item.type === 'benefit' ? 'Benefit' : 'Deduction'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {item.type === 'benefit' ? (
                                          item.taxable ? 'Taxable' : 'Non-Taxable'
                                        ) : (
                                          item.taxable ? 'Tax-Deductible' : 'Non-Tax-Deductible'
                                        )}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {currency === 'USD' ? '$' : 'ZWG'} {parseFloat(item.amount).toFixed(2)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                        <button
                                          onClick={() => handleRemoveItem(item.id)}
                                          className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </motion.tr>
                                  ))}
                                </AnimatePresence>
                              </tbody>
                            </table>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-gray-500 text-center"
                          >
                            <p>No benefits or deductions added yet</p>
                            <p className="text-sm mt-2">Add some items using the form above</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={() => setActiveSection('income')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <div className="space-x-3">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          onClick={calculateTax}
                          className={`px-6 py-2 rounded-lg text-white ${themeClasses[theme].primary} transition-colors shadow-sm hover:shadow`}
                        >
                          Calculate Tax
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          {activeSection === 'results' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <div className={`w-16 h-16 border-t-4 border-b-4 ${themeClasses[theme].border} rounded-full animate-spin mb-4`}></div>
                  <p className="text-lg text-gray-600">Calculating your tax...</p>
                </div>
              ) : (
                <>
                  {taxResult ? (
                    <div className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className={`text-xl font-bold ${themeClasses[theme].accent}`}>Tax Calculation Results</h2>
                        <button
                          onClick={handleReset}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          New Calculation
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Breakdown */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        >
                          <div className={`bg-gray-50 px-4 py-3 border-b ${themeClasses[theme].border}`}>
                            <h3 className="text-md font-medium">Income Breakdown</h3>
                          </div>
                          <div className="divide-y divide-gray-200">
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">Basic Salary</span>
                              <span className="text-sm font-medium">{formatCurrency(taxResult.grossIncome)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">Taxable Benefits</span>
                              <span className="text-sm font-medium">{formatCurrency(taxResult.taxableBenefits)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">Total Deductions</span>
                              <span className="text-sm font-medium">-{formatCurrency(taxResult.totalDeductions)}</span>
                            </div>
                            <div className={`flex justify-between px-4 py-3 ${themeClasses[theme].highlight}`}>
                              <span className="text-sm font-medium">Taxable Income</span>
                              <span className="text-sm font-bold">{formatCurrency(taxResult.taxableIncome)}</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Tax Summary */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        >
                          <div className={`bg-gray-50 px-4 py-3 border-b ${themeClasses[theme].border}`}>
                            <h3 className="text-md font-medium">Tax Summary</h3>
                          </div>
                          <div className="divide-y divide-gray-200">
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">Income Tax</span>
                              <span className="text-sm font-medium">{formatCurrency(taxResult.incomeTax)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">AIDS Levy (3%)</span>
                              <span className="text-sm font-medium">{formatCurrency(taxResult.aidsLevy)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-gray-50">
                              <span className="text-sm font-medium">Total Tax</span>
                              <span className="text-sm font-bold">{formatCurrency(taxResult.totalTax)}</span>
                            </div>
                            <div className={`flex justify-between px-4 py-3 ${themeClasses[theme].secondary}`}>
                              <span className="text-sm font-medium">Net Income</span>
                              <span className="text-sm font-bold">{formatCurrency(taxResult.netIncome)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">Effective Tax Rate</span>
                              <span className="text-sm font-medium">{taxResult.effectiveTaxRate.toFixed(2)}%</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Visualization */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
                      >
                        <h3 className={`text-lg font-medium mb-4 ${themeClasses[theme].accent}`}>Income Distribution</h3>
                        <div className="h-10 w-full rounded-full overflow-hidden bg-gray-200">
                          {/* Tax portion */}
                          <div
                            className={`h-full ${themeClasses[theme].primary} text-xs text-white flex items-center justify-center`}
                            style={{
                              width: `${Math.min(100, taxResult.effectiveTaxRate)}%`,
                              transition: 'width 0.5s ease-in-out'
                            }}
                          >
                            {taxResult.effectiveTaxRate > 5 ? `${taxResult.effectiveTaxRate.toFixed(1)}%` : ''}
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${themeClasses[theme].primary} rounded-sm mr-1`}></div>
                            Tax ({taxResult.effectiveTaxRate.toFixed(1)}%)
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-200 rounded-sm mr-1"></div>
                            Take-home ({(100 - taxResult.effectiveTaxRate).toFixed(1)}%)
                          </div>
                        </div>
                      </motion.div>

                      {/* Notes & Summary */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
                      >
                        <div className="md:col-span-2">
                          <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium mb-3">Notes</h3>
                            <ul className="text-sm text-gray-600 space-y-2">
                              <li className="flex">
                                <span className="mr-2">•</span>
                                <span>Tax calculations are based on the Zimbabwe Revenue Authority PAYE Tax Tables for 2025.</span>
                              </li>
                              <li className="flex">
                                <span className="mr-2">•</span>
                                <span>Taxable benefits are added to your basic salary to determine taxable income.</span>
                              </li>
                              <li className="flex">
                                <span className="mr-2">•</span>
                                <span>Tax-deductible items reduce your taxable income before tax is calculated.</span>
                              </li>
                              <li className="flex">
                                <span className="mr-2">•</span>
                                <span>AIDS Levy is calculated at 3% of the income tax payable.</span>
                              </li>
                              <li className="flex">
                                <span className="mr-2">•</span>
                                <span>This calculator provides estimates only and should not be used for official tax filing purposes.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div>
                          <div className={`p-5 rounded-lg text-white bg-gradient-to-br ${themeClasses[theme].gradient}`}>
                            <h3 className="text-lg font-medium mb-3">Summary</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-white text-opacity-90">Period:</span>
                                <span className="font-medium">{period.charAt(0).toUpperCase() + period.slice(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white text-opacity-90">Gross Income:</span>
                                <span className="font-medium">{formatCurrency(taxResult.grossIncome)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white text-opacity-90">Total Tax:</span>
                                <span className="font-medium">{formatCurrency(taxResult.totalTax)}</span>
                              </div>
                              <div className="flex justify-between border-t border-white border-opacity-20 pt-2 mt-2">
                                <span className="font-medium">Net Income:</span>
                                <span className="font-bold">{formatCurrency(taxResult.netIncome)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <div className="mt-6 flex justify-between">
                        <button
                          onClick={() => setActiveSection('benefits')}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Back to Benefits
                        </button>
                        <button
                          onClick={handleReset}
                          className={`px-6 py-2 rounded-lg text-white ${themeClasses[theme].primary} transition-colors`}
                        >
                          New Calculation
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-600 mb-2">No Tax Calculation Yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md">
                        Complete the previous steps to see your tax calculation results here.
                      </p>
                      <button
                        onClick={() => setActiveSection('income')}
                        className={`px-6 py-2 rounded-lg text-white ${themeClasses[theme].primary} transition-colors`}
                      >
                        Start Calculation
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>© 2025 Zimbabwe Tax Calculator - For educational purposes only</p>
        <p className="mt-1">All calculations based on Zimbabwe Revenue Authority PAYE Tax Tables for 2025</p>
      </div>
    </div>
  );
};

export default ZimbabweTaxCalculator;
