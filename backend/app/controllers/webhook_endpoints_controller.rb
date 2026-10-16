# frozen_string_literal: true

class WebhookEndpointsController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: current_user.webhook_endpoints.order(created_at: :desc)
  end

  def show
    render json: current_user.webhook_endpoints.find(params[:id])
  end

  def create
    endpoint = current_user.webhook_endpoints.create!(endpoint_params)
    render json: endpoint, status: :created
  end

  def destroy
    current_user.webhook_endpoints.find(params[:id]).destroy!
    head :no_content
  end

  private

  def endpoint_params
    params.require(:webhook_endpoint).permit(:name)
  end
end
