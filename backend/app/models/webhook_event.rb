class WebhookEvent < ApplicationRecord
  belongs_to :webhook_endpoint

  validates :http_method, presence: true
  validates :headers, presence: true
end
