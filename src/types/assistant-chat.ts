export type TransactionSummaryCard = {
  title?: string;
  id?: string;
  displayId?: string;
  amount?: string;
  description?: string;
  category?: string;
  account?: string;
  date?: string;
  transactionType?: string;
};

export type ChatSuggestion = {
  label: string;
  prompt: string;
  tone?: "default" | "primary" | "danger";
};

export type DocumentReviewCard = {
  title: string;
  tone?: "default" | "warning";
  subtitle?: string;
  fields: Array<{
    label: string;
    value: string;
    priority?: "primary" | "secondary";
  }>;
  suggestions?: ChatSuggestion[];
};

export type AssistantMessageMetadata = {
  preferredCurrencyCode?: string | null;
  selectedCategory?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
  selectedAccount?: {
    id: string;
    name: string;
    currency?: string | null;
    icon?: string | null;
  } | null;
  selectedBudget?: {
    id: string;
    name: string;
  } | null;
  selectedTransaction?: {
    id: string;
    description: string;
    type?: string | null;
  } | null;
};

export type AssistantDataParts = {
  transaction_summary: TransactionSummaryCard;
  chat_suggestions: {
    title?: string;
    items: ChatSuggestion[];
  };
  document_review: DocumentReviewCard;
};
