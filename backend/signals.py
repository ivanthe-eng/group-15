from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import WeeklyLog, LogStatusHistory


@receiver(pre_save, sender=WeeklyLog)
def auto_record_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        previous = WeeklyLog.objects.get(pk=instance.pk)
    except WeeklyLog.DoesNotExist:
        return
    if previous.status != instance.status:
        LogStatusHistory.objects.create(
            log=instance,
            changed_by=None,
            from_status=previous.status,
            to_status=instance.status,
            comment='Auto-recorded by signal.'
        )