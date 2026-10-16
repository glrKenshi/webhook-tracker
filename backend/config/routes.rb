Rails.application.routes.draw do
  devise_for :users,
    defaults: { format: :json },
    controllers: {
      sessions: "users/sessions",
      registrations: "users/registrations"
    }

  resources :webhook_endpoints, only: %i[index show create destroy] do
    resources :webhook_events, only: %i[index show], shallow: true
  end

  post "i/:token", to: "inbound_webhooks#create"

  get "up" => "rails/health#show", as: :rails_health_check
end
