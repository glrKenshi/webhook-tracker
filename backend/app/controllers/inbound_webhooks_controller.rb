# frozen_string_literal: true

class InboundWebhooksController < ApplicationController
  def create
    endpoint = WebhookEndpoint.find_by!(token: params[:token])

    headers = request.env.select { |key, _value| key.start_with?("HTTP_") || key == "CONTENT_TYPE" }

    endpoint.webhook_events.create!(
      http_method: request.method,
      headers: headers.to_json,
      body: request.raw_post,
      content_type: request.media_type
    )

    head :ok
  end
end
