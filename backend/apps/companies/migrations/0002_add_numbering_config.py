# Generated migration for invoice/quotation numbering feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='invoice_prefix',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='company',
            name='invoice_suffix',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='company',
            name='invoice_number_order',
            field=models.CharField(default='prefix,number,suffix', help_text='Order of invoice number components (comma-separated: prefix,number,suffix)', max_length=50),
        ),
        migrations.AddField(
            model_name='company',
            name='invoice_next_number',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='company',
            name='quotation_prefix',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='company',
            name='quotation_suffix',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='company',
            name='quotation_number_order',
            field=models.CharField(default='prefix,number,suffix', help_text='Order of quotation number components (comma-separated: prefix,number,suffix)', max_length=50),
        ),
        migrations.AddField(
            model_name='company',
            name='quotation_next_number',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
