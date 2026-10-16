class CreateWebhookEndpoints < ActiveRecord::Migration[8.1]
  def change
    create_table :webhook_endpoints do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name
      t.string :token

      t.timestamps
    end

    add_index :webhook_endpoints, :token, unique: true
  end
end
