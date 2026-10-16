class User < ApplicationRecord
  has_many :webhook_endpoints, dependent: :destroy

  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: self

  def as_json()
    { id: id, email: email }
  end
end
