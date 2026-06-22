import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2, ChevronRight, Droplets, HeartPulse, Sparkles, SunMedium, TimerReset, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quizOptions = {
  skinType: [
    { value: 'Oily', label: 'Oily' },
    { value: 'Dry', label: 'Dry' },
    { value: 'Combination', label: 'Combination' },
    { value: 'Sensitive', label: 'Sensitive' },
    { value: 'Acne-Prone', label: 'Acne-prone' },
  ],
  concern: [
    { value: 'acne', label: 'Acne / breakouts' },
    { value: 'dryness', label: 'Dryness / dehydration' },
    { value: 'brightening', label: 'Dullness / brightening' },
    { value: 'anti-aging', label: 'Fine lines / anti-aging' },
    { value: 'sun-protection', label: 'Sun protection' },
  ],
  routine: [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ],
  productType: [
    { value: 'any', label: 'Any' },
    { value: 'Cleanser', label: 'Cleanser' },
    { value: 'Toner', label: 'Toner' },
    { value: 'Serum', label: 'Serum' },
    { value: 'Moisturiser', label: 'Moisturiser' },
    { value: 'Sunscreen', label: 'Sunscreen' },
    { value: 'Mask', label: 'Mask' },
    { value: 'Essence', label: 'Essence' },
    { value: 'Eye Care', label: 'Eye care' },
  ],
  sensitivity: [
    { value: 'low', label: 'Low sensitivity' },
    { value: 'medium', label: 'Moderate sensitivity' },
    { value: 'high', label: 'Very sensitive' },
  ],
  budget: [
    { value: 'budget', label: 'Under NPR 2,000' },
    { value: 'mid', label: 'NPR 2,000 - 4,000' },
    { value: 'premium', label: 'Above NPR 4,000' },
  ],
  texture: [
    { value: 'light', label: 'Lightweight / watery' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'rich', label: 'Rich / creamy' },
  ],
  ingredient: [
    { value: 'hydration', label: 'Hydration / barrier support' },
    { value: 'soothing', label: 'Soothing / calming' },
    { value: 'brightening', label: 'Brightening' },
    { value: 'repair', label: 'Repair / recovery' },
    { value: 'anti-aging', label: 'Anti-aging' },
  ],
  frequency: [
    { value: 'morning', label: 'Morning' },
    { value: 'night', label: 'Night' },
    { value: 'both', label: 'Both' },
  ],
};

const initialAnswers = {
  skinType: '',
  concern: '',
  routine: '',
  productType: 'any',
  sensitivity: '',
  budget: '',
  texture: '',
  ingredient: '',
  frequency: '',
};

const budgetMap = {
  budget: { maxPrice: 2500 },
  mid: { minPrice: 1800, maxPrice: 4500 },
  premium: { minPrice: 3500 },
};

function OptionGroup({ title, icon: Icon, name, value, onChange, options, hint }) {
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/85 p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-black/5">
          <Icon size={18} className="text-black/70" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          <p className="mt-1 text-sm text-black/55">{hint}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(name, option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-black bg-black text-white'
                  : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-black hover:text-white'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const quizSteps = [
  {
    name: 'skinType',
    title: '1. What is your skin type?',
    hint: 'This is the strongest filter.',
    icon: Droplets,
    options: quizOptions.skinType,
  },
  {
    name: 'concern',
    title: '2. What is your main concern?',
    hint: 'We use this to rank products by purpose.',
    icon: Sparkles,
    options: quizOptions.concern,
  },
  {
    name: 'routine',
    title: '3. How advanced is your routine?',
    hint: 'Beginner routines get simpler product suggestions.',
    icon: TimerReset,
    options: quizOptions.routine,
  },
  {
    name: 'productType',
    title: '4. Which product type do you want?',
    hint: 'Choose any, or narrow it to a specific category.',
    icon: HeartPulse,
    options: quizOptions.productType,
  },
  {
    name: 'sensitivity',
    title: '5. How sensitive is your skin?',
    hint: 'Sensitive skin pushes the results toward gentler products.',
    icon: Sparkles,
    options: quizOptions.sensitivity,
  },
  {
    name: 'budget',
    title: '6. What is your budget?',
    hint: 'Price filtering helps avoid unrealistic suggestions.',
    icon: Wallet,
    options: quizOptions.budget,
  },
  {
    name: 'texture',
    title: '7. What texture do you prefer?',
    hint: 'This helps match lighter or richer formulas.',
    icon: ChevronRight,
    options: quizOptions.texture,
  },
  {
    name: 'ingredient',
    title: '8. What do you want most from the formula?',
    hint: 'We score ingredients and benefits to refine results.',
    icon: SunMedium,
    options: quizOptions.ingredient,
  },
  {
    name: 'frequency',
    title: 'Bonus: When will you use it?',
    hint: 'Morning favors sunscreen; night favors repair products.',
    icon: CheckCircle2,
    options: quizOptions.frequency,
  },
];

export default function SkinQuizPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(initialAnswers);
  const [currentStep, setCurrentStep] = useState(0);

  const activeStep = quizSteps[currentStep];
  const StepIcon = activeStep.icon;
  const isLastStep = currentStep === quizSteps.length - 1;

  const updateAnswer = (name, value) => {
    setAnswers((current) => ({ ...current, [name]: value }));
  };

  const currentAnswer = answers[activeStep?.name];
  const canAdvance = Boolean(currentAnswer);

  const buildShopFilters = () => {
    const filters = new URLSearchParams();
    const skinType = answers.skinType;
    const concernCategoryMap = {
      acne: 'Cleanser',
      dryness: 'Moisturiser',
      brightening: 'Serum',
      'anti-aging': 'Serum',
      'sun-protection': 'Sunscreen',
    };
    const ingredientSearchMap = {
      hydration: 'hydration',
      soothing: 'soothing',
      brightening: 'bright',
      repair: 'repair',
      'anti-aging': 'peptide',
    };
    const concernSearchMap = {
      acne: 'acne',
      dryness: 'hydration',
      brightening: 'brightening',
      'anti-aging': 'repair',
      'sun-protection': 'sunscreen',
    };
    const preferredCategory =
      answers.productType && answers.productType !== 'any'
        ? answers.productType
        : concernCategoryMap[answers.concern] || '';

    if (skinType) filters.set('skinType', skinType);
    if (preferredCategory) filters.set('category', preferredCategory);

    const budget = budgetMap[answers.budget];
    if (budget?.minPrice !== undefined) filters.set('minPrice', String(budget.minPrice));
    if (budget?.maxPrice !== undefined) filters.set('maxPrice', String(budget.maxPrice));

    const searchTerm = concernSearchMap[answers.concern] || ingredientSearchMap[answers.ingredient] || '';
    if (searchTerm) filters.set('search', searchTerm);
    filters.set('sort', '-ratings.average');
    filters.set('page', '1');
    return filters;
  };

  const goNext = () => {
    if (!canAdvance) return;
    if (isLastStep) {
      navigate(`/shop?${buildShopFilters().toString()}`);
      return;
    }
    setCurrentStep((current) => Math.min(current + 1, quizSteps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  const resetQuiz = () => {
    setAnswers(initialAnswers);
    setCurrentStep(0);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>Skin Quiz | Homa</title>
        <meta
          name="description"
          content="Answer a few skincare questions and get personalized product suggestions from Homa."
        />
      </Helmet>

      <section className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">Personalized routine</p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-tight text-black md:text-7xl">
            Skin quiz that suggests products.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-black/65 md:text-lg">
            Answer a short set of questions and we will rank products based on your skin type, concern, budget, and routine.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goNext();
          }}
          className="mx-auto max-w-3xl"
        >
          <div className="rounded-[1.75rem] border border-black/10 bg-white/85 p-5 shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-black/45">
                  Question {currentStep + 1} of {quizSteps.length}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-black">{activeStep.title}</h2>
                <p className="mt-2 text-sm text-black/55">{activeStep.hint}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-black/5">
                <StepIcon size={18} className="text-black/70" />
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-black transition-all duration-300"
                style={{ width: `${((currentStep + 1) / quizSteps.length) * 100}%` }}
              />
            </div>

            <div className="mt-6">
              <OptionGroup
                title={activeStep.title}
                icon={StepIcon}
                name={activeStep.name}
                value={answers[activeStep.name]}
                onChange={updateAnswer}
                options={activeStep.options}
                hint={activeStep.hint}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!canAdvance}
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLastStep ? 'See suggestions' : 'Next'}
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={resetQuiz}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black hover:text-white"
              >
                Reset quiz
              </button>
            </div>
          </div>
        </form>

      </section>
    </main>
  );
}
