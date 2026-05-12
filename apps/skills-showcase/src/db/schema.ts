export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  source_page: string;
  consent_text_version: string;
  created_at: Date;
  updated_at: Date;
}
