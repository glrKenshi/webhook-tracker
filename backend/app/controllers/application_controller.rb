class ApplicationController < ActionController::Base
  # JSON API + JWT: без CSRF-токена из формы сессию просто обнуляем, а не падаем.
  protect_from_forgery with: :null_session

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes
end
