class WebhookEndpoint < ApplicationRecord
  belongs_to :user

  has_many :webhook_events, dependent: :destroy

  before_validation :ensure_token, on: :create

  validates :name, presence: true, length: { maximum: 100 }
  validates :token, presence: true, uniqueness: true

  private

  def ensure_token
    self.token ||= SecureRandom.hex(16)
  end
end
