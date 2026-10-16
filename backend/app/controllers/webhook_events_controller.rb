# frozen_string_literal: true

class WebhookEventsController < ApplicationController
  before_action :authenticate_user!

  def index
    endpoint = current_user.webhook_endpoints.find(params[:webhook_endpoint_id])
    render json: endpoint.webhook_events.order(created_at: :desc)
  end

  def show
    render json: WebhookEvent.where(webhook_endpoint_id: current_user.webhook_endpoints).find(params[:id])
  end
end
