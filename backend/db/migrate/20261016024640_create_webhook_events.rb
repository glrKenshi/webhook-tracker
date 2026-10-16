class CreateWebhookEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :webhook_events do |t|
      t.references :webhook_endpoint, null: false, foreign_key: true
      t.string :http_method
      t.text :headers
      t.text :body
      t.string :content_type

      t.timestamps
    end
  end
end
